'use client';

import { useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import { useSnackbar } from 'notistack';
import CollapsibleAbout from '../CollapsibleAbout';
import { FC_IDS, FC_METRIC_DEFS, type FcId } from '../types';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': {
		height: '100%',
	},
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

interface FormErrors {
	fc?: string;
	metric?: string;
	units?: string;
	startDate?: string;
	endDate?: string;
}

/**
 * Admin Portal — form for updating FC metric values.
 * FC dropdown, Metrics dropdown, units input, date pickers, teal submit button.
 */
function AdminPortalPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [fc, setFc] = useState('');
	const [metric, setMetric] = useState('');
	const [units, setUnits] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [errors, setErrors] = useState<FormErrors>({});

	const validate = (): boolean => {
		const newErrors: FormErrors = {};
		if (!fc) newErrors.fc = 'Fulfillment Center is required';
		if (!metric) newErrors.metric = 'Metric is required';
		if (!units.trim()) {
			newErrors.units = 'Units value is required';
		} else if (isNaN(Number(units)) || Number(units) < 0) {
			newErrors.units = 'Units must be a non-negative number';
		}
		if (!startDate) newErrors.startDate = 'Start date is required';
		if (!endDate) newErrors.endDate = 'End date is required';
		if (startDate && endDate && startDate > endDate) {
			newErrors.endDate = 'End date must be on or after start date';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) {
			enqueueSnackbar('Please fix the validation errors before submitting.', {
				variant: 'error',
			});
			return;
		}

		const metricLabel = FC_METRIC_DEFS.find((m) => m.key === metric)?.label || metric;

		enqueueSnackbar(
			`Successfully updated ${metricLabel} for ${fc}: ${Number(units).toLocaleString()} units (${startDate} to ${endDate})`,
			{ variant: 'success' }
		);

		// Reset form
		setFc('');
		setMetric('');
		setUnits('');
		setStartDate('');
		setEndDate('');
		setErrors({});
	};

	return (
		<Root
			scroll="content"
			header={
				<div className="flex items-center gap-3 py-2 px-6 w-full">
					<Typography className="text-lg font-bold tracking-tight">
						FreightLens
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Admin Portal — Update FC Metrics
					</Typography>
				</div>
			}
			content={
				<div className="w-full p-6 sm:p-8">
					<Paper className="p-6 max-w-xl">
						<Typography variant="h6" className="mb-4 font-semibold">
							Update FC Metric
						</Typography>

						<div className="flex flex-col gap-4">
							{/* FC Dropdown */}
							<TextField
								select
								label="Fulfillment Center"
								value={fc}
								onChange={(e) => {
									setFc(e.target.value);
									setErrors((prev) => ({ ...prev, fc: undefined }));
								}}
								error={Boolean(errors.fc)}
								helperText={errors.fc}
								fullWidth
								required
							>
								{FC_IDS.map((fcId) => (
									<MenuItem key={fcId} value={fcId}>{fcId}</MenuItem>
								))}
							</TextField>

							{/* Metrics Dropdown */}
							<TextField
								select
								label="Metric"
								value={metric}
								onChange={(e) => {
									setMetric(e.target.value);
									setErrors((prev) => ({ ...prev, metric: undefined }));
								}}
								error={Boolean(errors.metric)}
								helperText={errors.metric}
								fullWidth
								required
							>
								{FC_METRIC_DEFS.map((m) => (
									<MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>
								))}
							</TextField>

							{/* Units Input */}
							<TextField
								label="Units"
								value={units}
								onChange={(e) => {
									setUnits(e.target.value);
									setErrors((prev) => ({ ...prev, units: undefined }));
								}}
								error={Boolean(errors.units)}
								helperText={errors.units}
								fullWidth
								required
								slotProps={{
									input: {
										endAdornment: (
											<InputAdornment position="end">units</InputAdornment>
										),
									},
								}}
							/>

							{/* Date Range */}
							<div className="flex gap-4">
								<TextField
									type="date"
									label="Start Date"
									value={startDate}
									onChange={(e) => {
										setStartDate(e.target.value);
										setErrors((prev) => ({ ...prev, startDate: undefined }));
									}}
									error={Boolean(errors.startDate)}
									helperText={errors.startDate}
									fullWidth
									required
									slotProps={{
										inputLabel: { shrink: true },
									}}
								/>
								<TextField
									type="date"
									label="End Date"
									value={endDate}
									onChange={(e) => {
										setEndDate(e.target.value);
										setErrors((prev) => ({ ...prev, endDate: undefined }));
									}}
									error={Boolean(errors.endDate)}
									helperText={errors.endDate}
									fullWidth
									required
									slotProps={{
										inputLabel: { shrink: true },
									}}
								/>
							</div>

							{/* Submit Button */}
							<Button
								variant="contained"
								size="large"
								onClick={handleSubmit}
								sx={{
									backgroundColor: '#009688',
									'&:hover': { backgroundColor: '#00796b' },
									mt: 1,
								}}
							>
								Update FC Metric
							</Button>
						</div>
					</Paper>

					<CollapsibleAbout title="About Admin Portal">
						<Typography variant="body2" color="text.secondary" className="mb-2">
							The Admin Portal allows authorized users to update FC-level metric values for
							specific date ranges. Changes are applied to the Rolling 21 Days and FC Metric views.
						</Typography>
						<Typography variant="body2" color="text.secondary" className="mb-2">
							<strong>Fulfillment Center</strong> — select the target FC.
							<strong> Metric</strong> — choose which operational metric to update (e.g., Planned
							Capacity, Total Scheduled Qty, NCNS %).
						</Typography>
						<Typography variant="body2" color="text.secondary">
							<strong>Units</strong> — the new value to set for the selected metric.
							<strong> Date Range</strong> — the start and end dates define the window of days
							to which the update applies. All fields are required.
						</Typography>
					</CollapsibleAbout>
				</div>
			}
		/>
	);
}

export default AdminPortalPage;
