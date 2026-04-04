'use client';

import { useState, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { AnimatePresence, motion } from 'motion/react';
import UploadStep from './UploadStep';
import QualityStep from './QualityStep';
import MetadataStep from './MetadataStep';
import PublishStep from './PublishStep';
import {
	WIZARD_STEP_LABELS,
	INITIAL_WIZARD_CONTEXT,
	type WizardContext,
	type WizardStep,
} from '../types';

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

const STEP_ICONS: Record<number, string> = {
	0: 'heroicons-outline:cloud-arrow-up',
	1: 'heroicons-outline:shield-check',
	2: 'heroicons-outline:document-text',
	3: 'heroicons-outline:rocket-launch',
};

/**
 * 4-step ingest wizard: Upload → Quality → Metadata → Publish.
 */
export default function IngestWizardPage() {
	const [ctx, setCtx] = useState<WizardContext>({ ...INITIAL_WIZARD_CONTEXT });

	const updateCtx = useCallback((patch: Partial<WizardContext>) => {
		setCtx((prev) => ({ ...prev, ...patch }));
	}, []);

	const goToStep = useCallback((step: WizardStep) => {
		setCtx((prev) => ({ ...prev, step }));
	}, []);

	return (
		<Root
			header={
				<div className="flex flex-col w-full p-6 sm:px-8">
					<PageBreadcrumb className="mb-2" />
					<div className="flex items-center justify-between">
						<div>
							<Typography className="text-xl font-bold truncate">
								Dataset Ingest Wizard
							</Typography>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								Upload, validate, enrich, and publish datasets to the catalog.
							</Typography>
						</div>
						<Box className="flex items-center gap-2">
							{WIZARD_STEP_LABELS.map((label, i) => (
								<Chip
									key={label}
									label={label}
									size="small"
									icon={
										<FuseSvgIcon size={14}>
											{i < ctx.step
												? 'heroicons-solid:check-circle'
												: STEP_ICONS[i]}
										</FuseSvgIcon>
									}
									variant={i === ctx.step ? 'filled' : 'outlined'}
									color={i < ctx.step ? 'success' : i === ctx.step ? 'secondary' : 'default'}
									sx={{
										fontWeight: i === ctx.step ? 600 : 400,
										fontSize: '0.75rem',
									}}
								/>
							))}
						</Box>
					</div>
				</div>
			}
			content={
				<div className="w-full p-6 sm:p-8">
					<AnimatePresence mode="wait">
						<motion.div
							key={ctx.step}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
						>
							{ctx.step === 0 && (
								<UploadStep
									ctx={ctx}
									updateCtx={updateCtx}
									onNext={() => goToStep(1)}
								/>
							)}
							{ctx.step === 1 && (
								<QualityStep
									ctx={ctx}
									updateCtx={updateCtx}
									onNext={() => goToStep(2)}
									onBack={() => goToStep(0)}
								/>
							)}
							{ctx.step === 2 && (
								<MetadataStep
									ctx={ctx}
									updateCtx={updateCtx}
									onNext={() => goToStep(3)}
									onBack={() => goToStep(1)}
								/>
							)}
							{ctx.step === 3 && (
								<PublishStep
									ctx={ctx}
									updateCtx={updateCtx}
									onBack={() => goToStep(2)}
								/>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			}
		/>
	);
}
