'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { INDUSTRY_COLORS, type DatasetCatalogEntry } from '../../../types';

interface Props {
	entry: DatasetCatalogEntry;
	allEntries: DatasetCatalogEntry[];
	onNavigate: (entry: DatasetCatalogEntry) => void;
}

/**
 * Lineage tab — plain SVG DAG showing upstream→current.
 */
export default function LineageTab({ entry, allEntries, onNavigate }: Props) {
	const upstreams = entry.lineage.upstreamDatasets;
	const upstreamEntries = upstreams
		.map((ref) => allEntries.find((e) => e.name === ref || e.datasetId === ref))
		.filter(Boolean) as DatasetCatalogEntry[];

	const hasUpstream = upstreamEntries.length > 0;
	const nodeWidth = 160;
	const nodeHeight = 40;
	const svgWidth = 600;
	const svgHeight = hasUpstream ? Math.max(200, upstreamEntries.length * 70 + 40) : 120;
	const currentX = svgWidth - nodeWidth - 40;
	const currentY = svgHeight / 2 - nodeHeight / 2;

	return (
		<div className="space-y-3">
			<Paper variant="outlined" className="p-3">
				<Typography variant="body2" className="mb-2">{entry.lineage.description}</Typography>

				<svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 300 }}>
					{/* Current node */}
					<rect
						x={currentX}
						y={currentY}
						width={nodeWidth}
						height={nodeHeight}
						rx={6}
						fill="#0097A7"
						stroke="#00838F"
						strokeWidth={1.5}
					/>
					<text
						x={currentX + nodeWidth / 2}
						y={currentY + nodeHeight / 2 + 5}
						textAnchor="middle"
						fill="#fff"
						fontSize={12}
						fontWeight={600}
					>
						{entry.name}
					</text>

					{/* Upstream nodes */}
					{upstreamEntries.map((ue, i) => {
						const uy = (i + 1) * (svgHeight / (upstreamEntries.length + 1)) - nodeHeight / 2;
						const ux = 30;
						const color = INDUSTRY_COLORS[ue.industryTag];
						return (
							<g
								key={ue.datasetId}
								className="cursor-pointer"
								onClick={() => onNavigate(ue)}
							>
								<rect
									x={ux}
									y={uy}
									width={nodeWidth}
									height={nodeHeight}
									rx={6}
									fill="none"
									stroke={color}
									strokeWidth={1.5}
								/>
								<text
									x={ux + nodeWidth / 2}
									y={uy + nodeHeight / 2 + 5}
									textAnchor="middle"
									fill={color}
									fontSize={12}
									fontWeight={500}
								>
									{ue.name}
								</text>
								{/* Arrow */}
								<line
									x1={ux + nodeWidth}
									y1={uy + nodeHeight / 2}
									x2={currentX}
									y2={currentY + nodeHeight / 2}
									stroke="#999"
									strokeWidth={1.5}
									markerEnd="url(#arrowhead)"
								/>
								{/* Transform icon on arrow */}
								{entry.lineage.transformationQuery && (
									<text
										x={(ux + nodeWidth + currentX) / 2}
										y={(uy + nodeHeight / 2 + currentY + nodeHeight / 2) / 2 - 8}
										textAnchor="middle"
										fontSize={14}
									>
										{'</>'}
									</text>
								)}
							</g>
						);
					})}

					{!hasUpstream && (
						<text x={30} y={svgHeight / 2 + 5} fill="#999" fontSize={13}>
							No upstream datasets — direct source
						</text>
					)}

					<defs>
						<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
							<polygon points="0 0, 10 3.5, 0 7" fill="#999" />
						</marker>
					</defs>
				</svg>
			</Paper>

			{entry.lineage.transformationQuery && (
				<Chip
					icon={<AutoAwesomeIcon />}
					label="Lineage extracted via SQL"
					size="small"
					color="secondary"
					variant="outlined"
				/>
			)}

			{entry.lineage.transformationQuery && (
				<Paper variant="outlined" className="p-3">
					<Typography variant="caption" className="font-semibold block mb-1">Transformation Query</Typography>
					<pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
						{entry.lineage.transformationQuery}
					</pre>
				</Paper>
			)}
		</div>
	);
}
