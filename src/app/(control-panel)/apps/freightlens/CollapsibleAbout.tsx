'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CollapsibleAboutProps {
	title: string;
	children: React.ReactNode;
}

/**
 * Collapsible "About" section used at the bottom of FreightLens sub-pages.
 */
function CollapsibleAbout({ title, children }: CollapsibleAboutProps) {
	const [open, setOpen] = useState(false);

	return (
		<Paper className="mt-4" variant="outlined">
			<div
				className="flex items-center justify-between px-4 py-2 cursor-pointer"
				onClick={() => setOpen((v) => !v)}
			>
				<Typography variant="subtitle2" className="font-semibold">
					{title}
				</Typography>
				<IconButton size="small">
					{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
				</IconButton>
			</div>
			<Collapse in={open}>
				<div className="px-4 pb-4">
					{children}
				</div>
			</Collapse>
		</Paper>
	);
}

export default CollapsibleAbout;
