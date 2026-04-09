'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { motion } from 'motion/react';

const TEAL = '#15E49E';
const TEAL_HOVER = '#11b57e';
const TEAL_GLOW = 'rgba(42, 162, 117, 0.57)';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.7)';

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

/**
 * Hero section — SaaS App Dark inspired. Pure black, serif headline,
 * teal accent, centered layout with decorative gradient orbs.
 */
function HeroSection() {
	const scrollToProducts = () => {
		document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#000',
				position: 'relative',
				overflow: 'hidden'
			}}
		>
			{/* Decorative gradient orbs — Crypto Modern accent */}
			<Box
				sx={{
					position: 'absolute',
					width: 500,
					height: 500,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${TEAL}12 0%, transparent 70%)`,
					top: '-10%',
					right: '-5%',
					filter: 'blur(60px)',
					pointerEvents: 'none'
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					width: 400,
					height: 400,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255, 155, 62, 0.06) 0%, transparent 70%)',
					bottom: '-5%',
					left: '-5%',
					filter: 'blur(60px)',
					pointerEvents: 'none'
				}}
			/>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				style={{
					textAlign: 'center',
					padding: '24px',
					position: 'relative',
					zIndex: 1,
					maxWidth: 915
				}}
			>
				<motion.div variants={itemVariants}>
					<Typography
						sx={{
							color: TEAL,
							fontFamily: "'Caveat', cursive",
							fontWeight: 700,
							fontSize: '28px',
							lineHeight: '35px',
							letterSpacing: '0.5px',
							mb: 2
						}}
					>
						Engineering Portfolio
					</Typography>
				</motion.div>

				<motion.div variants={itemVariants}>
					<Typography
						sx={{
							color: '#fff',
							fontWeight: 700,
							fontSize: { xs: '32px', sm: '40px', md: '54px' },
							lineHeight: 1.3,
							letterSpacing: '-0.02em',
							fontFamily: "'Noto Serif KR', serif",
							mb: 2
						}}
					>
						Misbahuddin Mohammed
					</Typography>
				</motion.div>

				<motion.div variants={itemVariants}>
					<Typography
						sx={{
							color: TEAL,
							fontSize: { xs: '18px', md: '22px' },
							fontWeight: 500,
							letterSpacing: '0.5px',
							mb: 2
						}}
					>
						Senior Engineering Leader
					</Typography>
				</motion.div>

				<motion.div variants={itemVariants}>
					<Typography
						sx={{
							color: TEXT_MUTED,
							fontSize: { xs: '15px', md: '18px' },
							lineHeight: 2.11,
							maxWidth: 600,
							mx: 'auto',
							mb: 4
						}}
					>
						11 years at Amazon building and scaling engineering organizations across AI/ML, data platforms,
						and logistics operations. From real-time ML pipelines to LLM-powered data infrastructure —
						leading teams, shipping products, and driving $45M+ in combined business impact.
					</Typography>
				</motion.div>

				<motion.div variants={itemVariants}>
					<Box sx={{ display: 'inline-grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', mt: 1 }}>
						<Button
							onClick={scrollToProducts}
							sx={{
								backgroundColor: TEAL,
								color: '#1c1c1c',
								borderRadius: '60px',
								minHeight: { xs: 50, sm: 60 },
								px: { xs: 3, sm: 4 },
								fontWeight: 600,
								fontSize: { xs: '14px', sm: '16px' },
								textTransform: 'none',
								boxShadow: `0px 8px 20px -6px ${TEAL_GLOW}`,
								transition: 'all 0.4s ease',
								'&:hover': {
									backgroundColor: TEAL_HOVER,
									boxShadow: `0px 12px 30px -6px ${TEAL_GLOW}`,
									transform: 'translateY(-2px)'
								}
							}}
						>
							View Projects
						</Button>
						<Button
							href="/resume.pdf"
							target="_blank"
							rel="noopener noreferrer"
							variant="outlined"
							sx={{
								backgroundColor: 'transparent !important',
								border: '1px solid rgba(255, 255, 255, 0.3)',
								color: '#fff',
								borderRadius: '60px',
								minHeight: { xs: 50, sm: 60 },
								px: { xs: 3, sm: 4 },
								fontWeight: 500,
								fontSize: { xs: '14px', sm: '16px' },
								textTransform: 'none',
								transition: 'all 0.4s ease',
								'&:hover': {
									color: TEAL,
									borderColor: TEAL,
									backgroundColor: 'transparent !important'
								}
							}}
						>
							Read Resume
						</Button>
					</Box>
				</motion.div>
			</motion.div>
		</Box>
	);
}

export default HeroSection;
