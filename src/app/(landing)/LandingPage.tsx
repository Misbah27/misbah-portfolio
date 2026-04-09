'use client';

import Box from '@mui/material/Box';
import HeroSection from './sections/HeroSection';
import ImpactSection from './sections/ImpactSection';
import ProductsSection from './sections/ProductsSection';
import CareerSection from './sections/CareerSection';
import LeadershipSection from './sections/LeadershipSection';
import TechStackSection from './sections/TechStackSection';
import FooterSection from './sections/FooterSection';

/**
 * Portfolio landing page — full-page custom layout without Fuse sidebar.
 * Sets CSS custom properties to override Fuse's light-theme text colors,
 * so white/light text renders correctly on black backgrounds.
 */
function LandingPage() {
	return (
		<Box
			sx={{
				overflowY: 'auto',
				height: '100vh',
				bgcolor: '#000',
				color: '#fff',
				'--mui-palette-text-primary': '#ffffff',
				'--mui-palette-text-secondary': 'rgba(255, 255, 255, 0.7)',
				'--mui-palette-text-disabled': 'rgba(255, 255, 255, 0.4)',
				'--mui-palette-background-default': '#000000',
				'--mui-palette-background-paper': '#0a0a0a',
				'--mui-palette-divider': 'rgba(255, 255, 255, 0.1)',
				'--mui-palette-primary-main': '#15E49E',
				'--mui-palette-primary-light': '#4AEDB5',
				'--mui-palette-primary-dark': '#11b57e',
				'--mui-palette-action-active': 'rgba(255, 255, 255, 0.7)',
				'--mui-palette-action-hover': 'rgba(255, 255, 255, 0.08)'
			}}
		>
			<HeroSection />
			<ImpactSection />
			<ProductsSection />
			<CareerSection />
			<LeadershipSection />
			<TechStackSection />
			<FooterSection />
		</Box>
	);
}

export default LandingPage;
