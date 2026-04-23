"""
Email Notifier — SMTP Alert Emails

Sends rich HTML notification emails via Zoho SMTP when the AI monitor
detects deployment issues (critical/high severity alerts).
"""
import asyncio
import logging
import os
import ssl
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

logger = logging.getLogger(__name__)

# Severity thresholds that trigger email notifications
EMAIL_SEVERITY_THRESHOLD = {"critical", "high"}

# Cooldown: don't spam — at most 1 email every 5 minutes
_last_email_sent: datetime | None = None
EMAIL_COOLDOWN_SECONDS = 300


def _get_smtp_config() -> dict:
    """Read SMTP configuration from environment."""
    return {
        "server": os.getenv("SMTP_SERVER", ""),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "username": os.getenv("SMTP_USERNAME", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_email": os.getenv("FROM_EMAIL", ""),
        "from_name": os.getenv("FROM_NAME", "Pinnacle SIEM"),
        "recipients": [
            r.strip()
            for r in os.getenv("ALERT_EMAIL_RECIPIENTS", "").split(",")
            if r.strip()
        ],
    }


def _severity_color(severity: str) -> str:
    """Get the badge color for a severity level."""
    return {
        "critical": "#dc2626",
        "high": "#ea580c",
        "medium": "#d97706",
        "low": "#2563eb",
        "info": "#6b7280",
    }.get(severity, "#6b7280")


def _severity_bg(severity: str) -> str:
    """Get the light background color for a severity level."""
    return {
        "critical": "#fef2f2",
        "high": "#fff7ed",
        "medium": "#fffbeb",
        "low": "#eff6ff",
        "info": "#f9fafb",
    }.get(severity, "#f9fafb")


def _category_icon(category: str) -> str:
    """Get an emoji icon for the alert category."""
    return {
        "security": "🛡️",
        "website_failure": "🌐",
        "performance": "⚡",
        "authentication": "🔐",
        "infrastructure": "🏗️",
        "data_integrity": "💾",
        "compliance": "📋",
        "deployment": "🚀",
    }.get(category, "⚠️")


def _build_alert_card(alert: dict) -> str:
    """Build an HTML card for a single alert."""
    severity = alert.get("severity", "info")
    category = alert.get("category", "infrastructure")
    title = alert.get("title", "Untitled Alert")
    description = alert.get("description", "")
    affected = alert.get("affected_resources", "N/A")
    action = alert.get("recommended_action", "")
    color = _severity_color(severity)
    bg = _severity_bg(severity)
    icon = _category_icon(category)

    return f"""
    <tr>
      <td style="padding: 0 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: {bg}; border-radius: 12px; border-left: 4px solid {color}; overflow: hidden;">
          <tr>
            <td style="padding: 20px 24px;">
              <!-- Header Row -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: 'Segoe UI', Arial, sans-serif;">
                    <span style="font-size: 14px; color: #64748b;">{icon} {category.replace('_', ' ').title()}</span>
                    <h3 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 600; color: #1e293b; line-height: 1.3;">{title}</h3>
                  </td>
                  <td style="vertical-align: top; text-align: right; white-space: nowrap;">
                    <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; background: {color}; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Segoe UI', Arial, sans-serif;">{severity}</span>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <p style="margin: 14px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif;">{description}</p>

              <!-- Details Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06);">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">Affected Resources</span><br/>
                    <span style="font-size: 13px; color: #334155; font-weight: 600; font-family: 'Courier New', monospace;">{affected}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">Recommended Action</span><br/>
                    <span style="font-size: 13px; color: #334155; line-height: 1.5; font-family: 'Segoe UI', Arial, sans-serif;">{action}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    """


def _build_html_email(alerts: list[dict], analysis_id: str, log_count: int) -> str:
    """Build the complete HTML email body."""
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S UTC")
    app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost")

    # Count by severity
    severity_counts = {}
    for a in alerts:
        s = a.get("severity", "info")
        severity_counts[s] = severity_counts.get(s, 0) + 1

    critical_count = severity_counts.get("critical", 0)
    high_count = severity_counts.get("high", 0)
    total = len(alerts)

    # Build summary badges
    summary_badges = ""
    for sev in ["critical", "high", "medium", "low", "info"]:
        count = severity_counts.get(sev, 0)
        if count > 0:
            color = _severity_color(sev)
            summary_badges += f'<span style="display: inline-block; margin: 0 4px 4px 0; padding: 4px 12px; border-radius: 16px; background: {color}; color: #fff; font-size: 12px; font-weight: 600; font-family: \'Segoe UI\', Arial, sans-serif;">{count} {sev.upper()}</span> '

    # Build alert cards
    alert_cards = ""
    for alert in alerts:
        alert_cards += _build_alert_card(alert)

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Pinnacle SIEM Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Logo / Brand Header -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: 'Segoe UI', Arial, sans-serif;">
                    <span style="font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">🔺 PINNACLE</span>
                    <span style="font-size: 16px; color: #94a3b8; font-weight: 400; margin-left: 4px;">| Alert Notification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Alert Banner -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 32px;">
                    <!-- Status Badge -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; background: {'#dc2626' if critical_count > 0 else '#ea580c' if high_count > 0 else '#d97706'}; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif;">
                            {'🚨 CRITICAL ALERT' if critical_count > 0 else '⚠️ HIGH PRIORITY ALERT' if high_count > 0 else '📋 ALERT NOTIFICATION'}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h1 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3; font-family: 'Segoe UI', Arial, sans-serif;">
                      AI Detected {total} Deployment {'Issue' if total == 1 else 'Issues'}
                    </h1>

                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.5; font-family: 'Segoe UI', Arial, sans-serif;">
                      Automated analysis of <strong style="color: #e2e8f0;">{log_count} logs</strong> detected potential issues requiring attention.
                    </p>

                    <!-- Summary Badges -->
                    <div style="margin-bottom: 4px;">
                      {summary_badges}
                    </div>

                    <!-- Timestamp & Analysis ID -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                      <tr>
                        <td style="font-family: 'Segoe UI', Arial, sans-serif;">
                          <span style="font-size: 12px; color: #64748b;">Global time: </span>
                          <span style="font-size: 12px; color: #cbd5e1; font-weight: 600;">{now}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Segoe UI', Arial, sans-serif; padding-top: 4px;">
                          <span style="font-size: 12px; color: #64748b;">Analysis ID: </span>
                          <span style="font-size: 12px; color: #cbd5e1; font-family: 'Courier New', monospace;">{analysis_id}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Cards -->
          {alert_cards}

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; font-family: 'Segoe UI', Arial, sans-serif;">Investigate these alerts on your dashboard</p>
                    <table cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="{app_url}/dashboard/ai-insights" style="display: inline-block; padding: 12px 28px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 0.3px;">VIEW ALERTS</a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="{app_url}/dashboard/logs" style="display: inline-block; padding: 12px 28px; background: #ffffff; color: #0f172a; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; border: 2px solid #e2e8f0; letter-spacing: 0.3px;">VIEW LOGS</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 24px 32px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif;">
                Sent by <strong style="color: #64748b;">Pinnacle SIEM</strong> — AI-Powered Security Monitoring<br/>
                This is an automated alert from your deployment monitoring system.<br/>
                <span style="color: #cbd5e1;">━━━━━━━━━━━━━━━━━━━━</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_alert_email(alerts: list[dict], analysis_id: str, log_count: int) -> bool:
    """
    Send an HTML alert email for detected deployment issues.

    Only sends for critical/high severity alerts, with a cooldown to prevent spam.
    Returns True if email was sent successfully.
    """
    global _last_email_sent

    if not alerts:
        return False

    # Filter to only email-worthy alerts (critical / high)
    email_alerts = [a for a in alerts if a.get("severity", "info") in EMAIL_SEVERITY_THRESHOLD]
    if not email_alerts:
        logger.debug("[Email] No critical/high alerts — skipping email notification")
        return False

    # Cooldown check
    if _last_email_sent:
        elapsed = (datetime.now(timezone.utc) - _last_email_sent).total_seconds()
        if elapsed < EMAIL_COOLDOWN_SECONDS:
            logger.debug("[Email] Cooldown active (%ds remaining) — skipping", EMAIL_COOLDOWN_SECONDS - elapsed)
            return False

    # Get SMTP config
    config = _get_smtp_config()
    if not config["server"] or not config["username"] or not config["recipients"]:
        logger.warning("[Email] SMTP not configured — skipping email notification")
        return False

    # Build email
    html_body = _build_html_email(email_alerts, analysis_id, log_count)

    # Subject line
    severity_summary = []
    critical_count = sum(1 for a in email_alerts if a.get("severity") == "critical")
    high_count = sum(1 for a in email_alerts if a.get("severity") == "high")
    if critical_count:
        severity_summary.append(f"{critical_count} Critical")
    if high_count:
        severity_summary.append(f"{high_count} High")
    subject = f"🚨 Pinnacle Alert: {', '.join(severity_summary)} — {email_alerts[0].get('title', 'Deployment Issue')}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{config['from_name']} <{config['from_email']}>"
    msg["To"] = ", ".join(config["recipients"])

    # Plain text fallback
    plain_text = f"Pinnacle SIEM Alert\n\n"
    plain_text += f"{len(email_alerts)} deployment issue(s) detected.\n\n"
    for a in email_alerts:
        plain_text += f"[{a.get('severity', '').upper()}] {a.get('title', '')}\n"
        plain_text += f"  {a.get('description', '')}\n"
        plain_text += f"  Affected: {a.get('affected_resources', 'N/A')}\n"
        plain_text += f"  Action: {a.get('recommended_action', '')}\n\n"

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        # Create TLS context
        tls_context = ssl.create_default_context()

        await aiosmtplib.send(
            msg,
            hostname=config["server"],
            port=config["port"],
            username=config["username"],
            password=config["password"],
            start_tls=True,
            tls_context=tls_context,
        )

        _last_email_sent = datetime.now(timezone.utc)
        logger.info(
            "[Email] Alert email sent to %s (%d alerts, analysis_id=%s)",
            ", ".join(config["recipients"]),
            len(email_alerts),
            analysis_id,
        )
        return True

    except aiosmtplib.SMTPAuthenticationError as e:
        logger.error("[Email] SMTP authentication failed: %s", e)
        return False
    except aiosmtplib.SMTPConnectError as e:
        logger.error("[Email] Could not connect to SMTP server: %s", e)
        return False
    except Exception as e:
        logger.error("[Email] Failed to send alert email: %s", e)
        return False
