'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { motion } from 'motion/react';

const TEAL = '#15E49E';
const ORANGE = '#FF9B3E';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.7)';

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

interface Milestone {
	period: string;
	role: string;
	org: string;
	highlights: string[];
}

const milestones: Milestone[] = [
	{
		period: 'Sep 2014 – Mar 2016',
		role: 'Support Engineer',
		org: 'Corporate Logistics · Hyderabad',
		highlights: [
			'R-Shiny scheduling tool replaced Excel — 60% efficiency gain, 80% error reduction',
			'94% team productivity — 15% above Amazon average'
		]
	},
	{
		period: 'Apr 2016 – Mar 2018',
		role: 'Manager, Web Development & Automation',
		org: 'Corporate Logistics · Hyderabad',
		highlights: [
			'Heimdall (TAT 6.7→2.2hr), LoFAT ($0.6M saved), 9 serverless products — 5M+ views',
			'Automated 42 processes saving 30,000+ man-hours annually'
		]
	},
	{
		period: 'Apr 2018 – Apr 2022',
		role: 'Senior Software Development Manager',
		org: 'Corporate Logistics · Hyderabad',
		highlights: [
			'Scaled org 3→22 engineers across India, Dubai, Mexico — $43M+ combined impact',
			'Delivered Heimdall, DFT, Delay Alert Dashboard across 6 regions'
		]
	},
	{
		period: 'Apr 2022 – Present',
		role: 'Senior Software Development Manager',
		org: 'People Experience & Central Science · Seattle',
		highlights: [
			'AMG adopted org-wide — 73.2% of 203K internal tables had no descriptions before',
			'$1.2M annual savings · 500 hrs/month manual curation eliminated'
		]
	}
];

/**
 * Career timeline — horizontal on desktop with connecting line, vertical on mobile.
 */
function CareerSection() {
	return (
		<Box
			id="career"
			sx={{
				py: { xs: 8, md: 12 },
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)'
			}}
		>
			<Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
				<Typography
					sx={{
						fontFamily: "'Caveat', cursive",
						fontWeight: 700,
						fontSize: { xs: '22px', md: '28px' },
						color: ORANGE,
						mb: 2
					}}
				>
					The journey
				</Typography>
				<Typography
					sx={{
						fontFamily: "'Noto Serif KR', serif",
						fontWeight: 700,
						fontSize: { xs: '24px', md: '30px' },
						color: '#fff',
						mb: 1
					}}
				>
					Career at Amazon
				</Typography>
				<Typography sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', md: '17px' }, lineHeight: 2.24 }}>
					Building teams and products across logistics, operations, and AI/ML
				</Typography>
			</Box>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.15 }}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						gap: '20px',
						maxWidth: 1200,
						mx: 'auto',
						position: 'relative'
					}}
				>
					{/* Horizontal connector line (desktop) */}
					<Box
						sx={{
							display: { xs: 'none', md: 'block' },
							position: 'absolute',
							top: 22,
							left: '8%',
							right: '8%',
							height: '1px',
							background: `linear-gradient(90deg, transparent, ${TEAL}40, ${TEAL}40, transparent)`
						}}
					/>

					{milestones.map((m, i) => (
						<motion.div
							key={m.period}
							variants={itemVariants}
							style={{ flex: 1 }}
						>
							<Box
								sx={{
									backgroundColor: 'rgba(255, 255, 255, 0.06)',
									borderRadius: '12px',
									p: 3,
									position: 'relative',
									transition: 'all 0.3s ease',
									borderTop: i === milestones.length - 1 ? `2px solid ${TEAL}` : '2px solid transparent',
									'&:hover': {
										transform: 'translateY(-5px)',
										backgroundColor: 'rgba(255, 255, 255, 0.09)'
									}
								}}
							>
								<Chip
									label={m.period}
									size="small"
									sx={{
										backgroundColor: `${TEAL}18`,
										color: TEAL,
										fontWeight: 600,
										fontSize: '12px',
										height: 26,
										mb: 1.5
									}}
								/>
								<Typography
									sx={{ color: '#fff', fontWeight: 600, fontSize: '15px', lineHeight: 1.4, mb: 0.5 }}
								>
									{m.role}
								</Typography>
								<Typography
									sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', mb: 1.5 }}
								>
									{m.org}
								</Typography>
								<Box
									component="ul"
									sx={{
										m: 0,
										pl: 2,
										'& li': {
											color: TEXT_MUTED,
											fontSize: '13px',
											lineHeight: 1.6,
											mb: 0.5
										}
									}}
								>
									{m.highlights.map((h) => (
										<li key={h}>{h}</li>
									))}
								</Box>
							</Box>
						</motion.div>
					))}
				</Box>
			</motion.div>
		</Box>
	);
}

export default CareerSection;
