"use client";

import { useState, useEffect } from "react";

interface SafeDateProps {
    date: string | number | Date;
    options?: Intl.DateTimeFormatOptions;
    mode?: "toLocaleString" | "toLocaleTimeString" | "toLocaleDateString";
    className?: string;
    placeholder?: string;
}

export default function SafeDate({
    date,
    options,
    mode = "toLocaleString",
    className,
    placeholder = "—"
}: SafeDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <span className={className}>{placeholder}</span>;
    }

    try {
        const d = new Date(date);
        let formatted = "";

        if (mode === "toLocaleString") {
            formatted = d.toLocaleString("en-US", options);
        } else if (mode === "toLocaleTimeString") {
            formatted = d.toLocaleTimeString("en-US", options);
        } else if (mode === "toLocaleDateString") {
            formatted = d.toLocaleDateString("en-US", options);
        }

        return <span className={className}>{formatted}</span>;
    } catch (e) {
        return <span className={className}>{placeholder}</span>;
    }
}
