'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { motion } from 'motion/react';
import Link from 'next/link';

const TEAL = '#15E49E';
const TEAL_HOVER = '#11b57e';
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

interface Product {
	name: string;
	era: string;
	badge: string;
	tagline: string;
	impact: string;
	tech: string[];
	accent: string;
	href: string;
	scroll?: boolean;
}

const products: Product[] = [
	{
		name: 'DataOps Suite',
		era: '2022–Present',
		badge: 'AI/ML',
		tagline: 'LLM-powered data catalog, metadata generation, and PII obfuscation platform serving 203K+ internal tables.',
		impact: '$1.2M annual savings · 203K+ tables served',
		tech: ['Claude LLM', 'AWS Lambda', 'TypeScript'],
		accent: '#8b5cf6',
		href: '/apps/dataops'
	},
	{
		name: 'Heimdall (InboundIQ)',
		era: '2016–2018',
		badge: 'Operations',
		tagline: 'ML-driven dock door allocation engine that replaced all manual truck prioritization at fulfillment centers.',
		impact: 'TAT 6.7 → 2.2 hours · P95 SLA met consistently',
		tech: ['Python', 'ML Models', 'AWS Lambda'],
		accent: '#0ea5e9',
		href: '/apps/inboundiq'
	},
	{
		name: 'Delay Alert Dashboard',
		era: '2018–2022',
		badge: 'Logistics',
		tagline: 'Real-time linehaul delay visibility and automated rescue planning across 6 global regions.',
		impact: '6 regions · 10-min refresh · replaced manual spreadsheets',
		tech: ['Apache Kafka', 'React', 'AWS ECS'],
		accent: '#f59e0b',
		href: '/apps/nova'
	},
	{
		name: 'LoFAT',
		era: '2016–2018',
		badge: 'Fraud Detection',
		tagline: 'GPS telemetry fraud detection for last-mile delivery — automated flagging of spoofing, ghost deliveries, and coordinated fraud.',
		impact: '$0.6M saved · 37 headcount hires eliminated',
		tech: ['ML Anomaly Detection', 'GPS Telemetry', 'Python'],
		accent: '#ef4444',
		href: '/apps/lofat'
	},
	{
		name: 'Daily Freight Tracker',
		era: '2018–2022',
		badge: 'Logistics',
		tagline: 'Real-time freight scheduling visibility across 100+ fulfillment centers, replacing manual spreadsheets.',
		impact: '100+ FCs · 6 countries · real-time vs 30-min lag',
		tech: ['React', 'Apache Flink', 'DynamoDB'],
		accent: '#10b981',
		href: '/apps/freightlens'
	},
	{
		name: 'Reactive Scheduling',
		era: '2018–2022',
		badge: 'Optimization',
		tagline: 'Dynamic scheduling engine that optimized freight capacity allocation using demand forecasting and real-time signals.',
		impact: '$800K annual savings · 70% latency reduction',
		tech: ['Demand Forecasting', 'Apache Spark', 'AWS'],
		accent: '#6366f1',
		href: '#career',
		scroll: true
	}
];

/**
 * Products section — SaaS App Dark service-card style with colored accents.
 */
function ProductsSection() {
	const handleScrollToCareer = (e: React.MouseEvent) => {
		e.preventDefault();
		document.getElementById('career')?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<Box
			id="products"
			sx={{
				py: { xs: 8, md: 14 },
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)'
			}}
		>
			<Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: { xs: 5, md: 8 } }}>
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
					What I built
				</Typography>
				<Typography
					sx={{
						fontFamily: "'Noto Serif KR', serif",
						fontWeight: 700,
						fontSize: { xs: '24px', md: '30px' },
						lineHeight: 1.67,
						color: '#fff',
						mb: 1
					}}
				>
					Engineering Portfolio
				</Typography>
				<Typography sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', md: '17px' }, lineHeight: 2.24 }}>
					11+ years. 6 products. 3 continents.
				</Typography>
			</Box>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.1 }}
			>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
						gap: '20px',
						maxWidth: 1200,
						mx: 'auto'
					}}
				>
					{products.map((product) => (
						<motion.div key={product.name} variants={itemVariants}>
							<Box
								sx={{
									backgroundColor: 'rgba(255, 255, 255, 0.06)',
									borderRadius: '12px',
									p: '28px 24px',
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									borderLeft: `3px solid ${product.accent}`,
									transition: 'all 0.3s ease',
									cursor: 'default',
									'&:hover': {
										transform: 'translateY(-5px)',
										backgroundColor: 'rgba(255, 255, 255, 0.09)',
										boxShadow: `0px 14px 50px rgba(132, 159, 184, 0.1)`
									}
								}}
							>
								<Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
									<Chip
										label={product.era}
										size="small"
										sx={{
											backgroundColor: 'transparent',
											border: '1px solid rgba(255, 255, 255, 0.2)',
											color: TEXT_MUTED,
											fontSize: '12px',
											height: 24
										}}
									/>
									<Chip
										label={product.badge}
										size="small"
										sx={{
											backgroundColor: `${product.accent}20`,
											color: product.accent,
											fontSize: '12px',
											fontWeight: 600,
											height: 24
										}}
									/>
								</Box>

								<Typography
									sx={{
										color: '#fff',
										fontWeight: 600,
										fontSize: '17px',
										lineHeight: 1.35,
										letterSpacing: '0.1px',
										mb: 1
									}}
								>
									{product.name}
								</Typography>

								<Typography
									sx={{
										color: TEXT_MUTED,
										fontSize: '14px',
										lineHeight: 1.7,
										mb: 1.5,
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										flex: 1
									}}
								>
									{product.tagline}
								</Typography>

								<Typography sx={{ color: TEAL, fontWeight: 600, fontSize: '14px', mb: 2 }}>
									{product.impact}
								</Typography>

								<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
									{product.tech.map((t) => (
										<Chip
											key={t}
											label={t}
											size="small"
											sx={{
												backgroundColor: 'rgba(255, 255, 255, 0.08)',
												color: 'rgba(255, 255, 255, 0.5)',
												fontSize: '11px',
												height: 22,
												border: 'none'
											}}
										/>
									))}
								</Box>

								{product.scroll ? (
									<Button
										size="small"
										onClick={handleScrollToCareer}
										sx={{
											color: product.accent,
											textTransform: 'none',
											fontWeight: 500,
											justifyContent: 'flex-start',
											p: 0,
											'&:hover': { backgroundColor: 'transparent', color: '#fff' }
										}}
									>
										Explore &rarr;
									</Button>
								) : (
									<Button
										component={Link}
										href={product.href}
										size="small"
										sx={{
											color: product.accent,
											textTransform: 'none',
											fontWeight: 500,
											justifyContent: 'flex-start',
											p: 0,
											'&:hover': { backgroundColor: 'transparent', color: '#fff' }
										}}
									>
										Explore &rarr;
									</Button>
								)}
							</Box>
						</motion.div>
					))}
				</Box>
			</motion.div>
		</Box>
	);
}

export default ProductsSection;
