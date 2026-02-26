'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface BounceCardsProps {
    className?: string;
    images?: string[];
    containerWidth?: number;
    containerHeight?: number;
    animationDelay?: number;
    animationStagger?: number;
    easeType?: string;
    transformStyles?: string[];
    enableHover?: boolean;
}

export default function BounceCards({ className = '', images = [], containerWidth = 400, containerHeight = 400, animationDelay = 0.5, animationStagger = 0.06, easeType = 'elastic.out(1, 0.8)', transformStyles = ['rotate(10deg) translate(-170px)', 'rotate(5deg) translate(-85px)', 'rotate(-3deg)', 'rotate(-10deg) translate(85px)', 'rotate(2deg) translate(170px)'], enableHover = false }: BounceCardsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.card', { scale: 0 }, { scale: 1, stagger: animationStagger, ease: easeType, delay: animationDelay });
        }, containerRef);
        return () => ctx.revert();
    }, [animationDelay, animationStagger, easeType]);

    const getNoRotationTransform = (transformStr: string): string => {
        const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
        if (hasRotate) return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
        if (transformStr === 'none') return 'rotate(0deg)';
        return `${transformStr} rotate(0deg)`;
    };

    const getPushedTransform = (baseTransform: string, offsetX: number): string => {
        const translateRegex = /translate\(([-0-9.]+)px\)/;
        const match = baseTransform.match(translateRegex);
        if (match) { const newX = parseFloat(match[1]) + offsetX; return baseTransform.replace(translateRegex, `translate(${newX}px)`); }
        return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
    };

    const pushSiblings = (hoveredIdx: number) => {
        const q = gsap.utils.selector(containerRef);
        if (!enableHover || !containerRef.current) return;
        images.forEach((_, i) => {
            const selector = q(`.card-${i}`);
            gsap.killTweensOf(selector);
            const baseTransform = transformStyles[i] || 'none';
            if (i === hoveredIdx) {
                gsap.to(selector, { transform: getNoRotationTransform(baseTransform), duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
            } else {
                const offsetX = i < hoveredIdx ? -160 : 160;
                gsap.to(selector, { transform: getPushedTransform(baseTransform, offsetX), duration: 0.4, ease: 'back.out(1.4)', delay: Math.abs(hoveredIdx - i) * 0.05, overwrite: 'auto' });
            }
        });
    };

    const resetSiblings = () => {
        if (!enableHover || !containerRef.current) return;
        const q = gsap.utils.selector(containerRef);
        images.forEach((_, i) => {
            const selector = q(`.card-${i}`);
            gsap.killTweensOf(selector);
            gsap.to(selector, { transform: transformStyles[i] || 'none', duration: 0.4, ease: 'back.out(1.4)', overwrite: 'auto' });
        });
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`} ref={containerRef} style={{ width: containerWidth, height: containerHeight }}>
            {images.map((src, idx) => (
                <div key={idx} className={`card card-${idx} absolute w-[200px] aspect-square border-8 border-white rounded-[30px] overflow-hidden`} style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', transform: transformStyles[idx] || 'none' }} onMouseEnter={() => pushSiblings(idx)} onMouseLeave={resetSiblings}>
                    <img className="w-full h-full object-cover" src={src} alt={`card-${idx}`} />
                </div>
            ))}
        </div>
    );
}
