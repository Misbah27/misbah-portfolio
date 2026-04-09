'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';

const TEAL = '#15E49E';
const ORANGE = '#FF9B3E';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.7)';

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

interface StatItem {
	target: number;
	prefix: string;
	suffix: string;
	label: string;
	sublabel: string;
}

const stats: StatItem[] = [
	{ target: 45, prefix: '$', suffix: 'M+', label: 'Total portfolio impact', sublabel: 'Cost savings and revenue uplift across all products' },
	{ target: 22, prefix: '3 → ', suffix: '', label: 'Engineers grown', sublabel: 'Across India, Dubai, and Mexico' },
	{ target: 7, prefix: '', suffix: '', label: 'Engineers promoted', sublabel: 'With 12-month evidence-based promo cases' },
	{ target: 6, prefix: '', suffix: ' regions', label: 'Product deployments', sublabel: 'IN · AU · SG · DXB · KSA · LATAM' },
	{ target: 203, prefix: '', suffix: 'K+', label: 'Amazon tables served', sublabel: 'By AMG metadata platform' },
	{ target: 150, prefix: '', suffix: '+', label: 'Interviews conducted', sublabel: 'Across Amazon hiring initiatives' }
];

/**
 * Hook: animates number 0 → target with cubic ease-out.
 */
function useCountUp(target: number, triggered: boolean, duration = 1200): number {
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (!triggered) return;

		const start = performance.now();
		let raf: number;

		const step = (now: number) => {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			setValue(Math.round(eased * target));

			if (progress < 1) {
				raf = requestAnimationFrame(step);
			}
		};

		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [triggered, target, duration]);

	return value;
}

/**
 * SaaS App Dark stat card — glass background, teal numbers, hover lift.
 */
function StatCard({ stat, triggered, index }: { stat: StatItem; triggered: boolean; index: number }) {
	const count = useCountUp(stat.target, triggered);
	const isOdd = index % 2 === 1;

	return (
		<motion.div
			variants={itemVariants}
			style={{ position: 'relative', top: isOdd ? 30 : 0 }}
		>
			<Box
				sx={{
					backgroundColor: 'rgba(255, 255, 255, 0.15)',
					borderRadius: '10px',
					boxShadow: '0px 14px 50px rgba(132, 159, 184, 0.15)',
					p: { xs: '30px', sm: '50px 36px' },
					transition: 'transform 0.3s ease',
					'&:hover': { transform: 'translateY(-5px)' }
				}}
			>
				<Typography sx={{ color: '#fff', fontSize: { xs: '15px', sm: '17px' }, lineHeight: 1, mb: '5px' }}>
					{stat.label}
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', my: '5px' }}>
					<Typography
						sx={{
							fontFamily: "'DM Sans', sans-serif",
							fontSize: { xs: '48px', sm: '60px', md: '72px' },
							fontWeight: 400,
							lineHeight: 1,
							letterSpacing: '-0.02em',
							color: TEAL
						}}
					>
						{stat.prefix}{count}
					</Typography>
					{stat.suffix && (
						<Typography
							component="span"
							sx={{
								fontFamily: "'DM Sans', sans-serif",
								fontWeight: 500,
								fontSize: { xs: '24px', sm: '32px' },
								lineHeight: 1,
								letterSpacing: '-0.02em',
								color: TEAL,
								position: 'relative',
								top: '5px',
								ml: '5px'
							}}
						>
							{stat.suffix}
						</Typography>
					)}
				</Box>
				<Typography sx={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: 1.5 }}>
					{stat.sublabel}
				</Typography>
			</Box>
		</motion.div>
	);
}

/**
 * Impact numbers section — two-column layout: left title + right stat grid.
 */
function ImpactSection() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const [triggered, setTriggered] = useState(false);

	const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
		if (entries[0]?.isIntersecting) {
			setTriggered(true);
		}
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(handleIntersection, { threshold: 0.2 });

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => observer.disconnect();
	}, [handleIntersection]);

	return (
		<Box
			id="impact"
			ref={sectionRef}
			sx={{
				py: { xs: 8, md: 12 },
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)'
			}}
		>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate={triggered ? 'visible' : 'hidden'}
			>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
						gap: { xs: '40px', md: '100px' },
						maxWidth: 1200,
						mx: 'auto',
						alignItems: 'center'
					}}
				>
					{/* Left column — section title */}
					<motion.div variants={itemVariants}>
						<Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
							<Typography
								sx={{
									fontFamily: "'Caveat', cursive",
									fontWeight: 700,
									fontSize: { xs: '22px', md: '28px' },
									lineHeight: '35px',
									letterSpacing: '0.5px',
									color: ORANGE,
									mb: 2
								}}
							>
								By the numbers
							</Typography>
							<Typography
								sx={{
									fontFamily: "'Noto Serif KR', serif",
									fontWeight: 500,
									fontSize: { xs: '26px', md: '36px' },
									lineHeight: 1.37,
									letterSpacing: '-0.02em',
									color: '#fff',
									mb: 3
								}}
							>
								Portfolio Impact
							</Typography>
							<Typography
								sx={{
									color: TEXT_MUTED,
									fontSize: '16px',
									lineHeight: 2,
									maxWidth: 440,
									mx: { xs: 'auto', md: 0 }
								}}
							>
								11 years of building systems, growing teams, and delivering measurable business outcomes
								across logistics, AI/ML, and data platforms.
							</Typography>
						</Box>
					</motion.div>

					{/* Right column — stat cards grid */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
							gap: '20px'
						}}
					>
						{stats.map((stat, i) => (
							<StatCard
								key={stat.label}
								stat={stat}
								triggered={triggered}
								index={i}
							/>
						))}
					</Box>
				</Box>
			</motion.div>
		</Box>
	);
}

export default ImpactSection;
