'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
}));

/**
 * Obfuscation service page — placeholder for future session.
 */
export default function ObfuscationPage() {
	return (
		<Root
			header={
				<div className="flex flex-col w-full px-24 pt-24 pb-16 sm:px-32">
					<Typography className="text-3xl font-extrabold tracking-tight leading-none">
						Data Obfuscation
					</Typography>
					<Typography
						className="mt-4"
						color="text.secondary"
					>
						Apply format-preserving, deterministic HMAC-SHA256 obfuscation to PII columns.
					</Typography>
				</div>
			}
			content={
				<div className="w-full px-24 py-24 sm:px-32">
					<Typography color="text.secondary">
						Obfuscation service will be available in a future session.
					</Typography>
				</div>
			}
		/>
	);
}
