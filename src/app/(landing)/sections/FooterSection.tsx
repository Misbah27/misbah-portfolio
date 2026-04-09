'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const TEAL = '#15E49E';

const linkSx = {
	color: 'rgba(255, 255, 255, 0.4)',
	transition: 'all 0.4s ease',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 44,
	height: 44,
	borderRadius: '50%',
	backgroundColor: 'transparent !important',
	border: 'none',
	cursor: 'pointer',
	textDecoration: 'none',
	'&:hover': { color: TEAL }
} as const;

/**
 * Footer — minimal, dark, with teal hover accents on icon links.
 * Uses plain anchor tags to avoid Fuse IconButton background overrides.
 */
function FooterSection() {
	return (
		<Box
			sx={{
				py: 5,
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)',
				textAlign: 'center'
			}}
		>
			<Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
				<Box
					component="a"
					href="https://linkedin.com/in/misbahuddin-mohammed"
					target="_blank"
					rel="noopener noreferrer"
					sx={linkSx}
				>
					<FuseSvgIcon size={22}>heroicons-outline:user</FuseSvgIcon>
				</Box>
				<Box
					component="a"
					href="https://github.com/Misbah27"
					target="_blank"
					rel="noopener noreferrer"
					sx={linkSx}
				>
					<FuseSvgIcon size={22}>heroicons-outline:code-bracket-square</FuseSvgIcon>
				</Box>
				<Box
					component="a"
					href="mailto:misbah_2703@yahoo.com"
					sx={linkSx}
				>
					<FuseSvgIcon size={22}>heroicons-outline:envelope</FuseSvgIcon>
				</Box>
			</Box>
			<Typography sx={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '13px' }}>
				&copy; 2025 Misbahuddin Mohammed &middot; Senior Engineering Leader
			</Typography>
		</Box>
	);
}

export default FooterSection;
