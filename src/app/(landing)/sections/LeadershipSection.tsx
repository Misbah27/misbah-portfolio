'use client';

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

interface LeadershipStat {
	stat: string;
	label: string;
	sublabel: string;
}

const leadershipStats: LeadershipStat[] = [
	{ stat: '3 → 22', label: 'Engineers grown', sublabel: 'India · Dubai · Mexico' },
	{ stat: '7', label: 'Promotions driven', sublabel: '12-month evidence-based cases' },
	{ stat: '150+', label: 'Interviews conducted', sublabel: 'Across own team and broader org' },
	{ stat: '4.8 / 5', label: 'Connections score', sublabel: 'Structured mentorship program' },
	{ stat: '3 countries', label: 'Cross-geography', sublabel: 'Operated across time zones' },
	{ stat: 'VP-level', label: 'Executive visibility', sublabel: '3-year roadmaps · VP Monthly Reviews' }
];

interface Principle {
	title: string;
	detail: string;
}

const principles: Principle[] = [
	{
		title: 'Hire for judgment, not just skill',
		detail:
			'In a distributed org, engineers make decisions independently. Interview rubric weighted ambiguous problem-solving over technical trivia.'
	},
	{
		title: 'Promotion from day one',
		detail:
			'Wrote down what the next level looked like for each engineer from week one. Collected evidence for 12 months — not 3 weeks before the cycle.'
	},
	{
		title: 'Make the problem visible before solving it',
		detail:
			'The catalog metadata UI was shipped deliberately to surface completeness as a metric — creating the pressure that funded the AMG initiative.'
	},
	{
		title: 'Structured debt, not invisible debt',
		detail:
			'When shipping with known gaps, documented them in the ORR with owners and dates before going live. Debt registered and paid — not hoped away.'
	}
];

/**
 * People Leadership section — stats grid + principle cards, SaaS App Dark style.
 */
function LeadershipSection() {
	return (
		<Box
			id="leadership"
			sx={{
				py: { xs: 8, md: 12 },
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)'
			}}
		>
			<Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: { xs: 5, md: 7 } }}>
				<Typography
					sx={{
						fontFamily: "'Caveat', cursive",
						fontWeight: 700,
						fontSize: { xs: '22px', md: '28px' },
						color: ORANGE,
						mb: 2
					}}
				>
					People first
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
					Building teams, not just products
				</Typography>
				<Typography sx={{ color: TEXT_MUTED, fontSize: { xs: '15px', md: '17px' }, lineHeight: 2.24 }}>
					The work was never just technical. Building the org capable of doing the work was as important as the
					work itself.
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
						gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
						gap: { xs: '30px', md: '50px' },
						maxWidth: 1200,
						mx: 'auto'
					}}
				>
					{/* Left column — 6 leadership stats */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
							gap: '15px'
						}}
					>
						{leadershipStats.map((s, i) => (
							<motion.div
								key={s.label}
								variants={itemVariants}
								style={{ position: 'relative', top: i % 2 === 1 ? 20 : 0 }}
							>
								<Box
									sx={{
										backgroundColor: 'rgba(255, 255, 255, 0.15)',
										borderRadius: '10px',
										boxShadow: '0px 14px 50px rgba(132, 159, 184, 0.15)',
										p: '24px 20px',
										textAlign: 'center',
										transition: 'transform 0.3s ease',
										'&:hover': { transform: 'translateY(-5px)' }
									}}
								>
									<Typography
										sx={{
											fontFamily: "'DM Sans', sans-serif",
											fontSize: { xs: '28px', md: '32px' },
											fontWeight: 400,
											letterSpacing: '-0.02em',
											color: TEAL,
											lineHeight: 1,
											mb: 0.5
										}}
									>
										{s.stat}
									</Typography>
									<Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 500, mb: 0.5 }}>
										{s.label}
									</Typography>
									<Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
										{s.sublabel}
									</Typography>
								</Box>
							</motion.div>
						))}
					</Box>

					{/* Right column — 4 leadership principles */}
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
						{principles.map((p) => (
							<motion.div key={p.title} variants={itemVariants}>
								<Box
									sx={{
										backgroundColor: 'rgba(255, 255, 255, 0.06)',
										borderRadius: '12px',
										p: '24px',
										borderLeft: `3px solid ${TEAL}`,
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor: 'rgba(255, 255, 255, 0.09)',
											transform: 'translateY(-3px)'
										}
									}}
								>
									<Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '15px', mb: 1 }}>
										{p.title}
									</Typography>
									<Typography sx={{ color: TEXT_MUTED, fontSize: '14px', lineHeight: 1.7 }}>
										{p.detail}
									</Typography>
								</Box>
							</motion.div>
						))}
					</Box>
				</Box>
			</motion.div>
		</Box>
	);
}

export default LeadershipSection;
