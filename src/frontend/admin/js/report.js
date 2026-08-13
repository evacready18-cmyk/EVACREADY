import React from 'react'
import { USERS } from '../../data/users'
import '../css/reports.css'

const section = React.createElement

const ReportPage = () => {
	const evacuees = USERS
	const total = evacuees.length
	const discharged = evacuees.filter((e) => e.status === 'Discharged').length
	const inside = evacuees.filter((e) => e.status !== 'Discharged').length

	const recentReports = [
		{ id: 1, title: 'Evacuees Summary Report', time: 'May 31, 2025 10:30 AM' },
		{ id: 2, title: 'Evacuation Centers Report', time: 'May 31, 2025 10:15 AM' },
		{ id: 3, title: 'Daily Evacuees Report', time: 'May 30, 2025 11:59 PM' },
		{ id: 4, title: 'Discharge Report', time: 'May 30, 2025 08:45 PM' },
		{ id: 5, title: 'Alerts and Notifications Report', time: 'May 30, 2025 06:20 PM' },
	]

	return section(
		'div',
		{ className: 'reports-page' },
		section('div', { className: 'reports-header' }, section('h1', null, 'Reports Dashboard'), section('p', null, 'Overview of evacuation data and system reports')),

		section(
			'div',
			{ className: 'metric-row' },
			section('div', { className: 'metric' }, section('div', { className: 'metric-title' }, 'Total Evacuees'), section('div', { className: 'metric-value' }, String(total)), section('div', { className: 'metric-sub' }, '+12% from last month')),
			section('div', { className: 'metric' }, section('div', { className: 'metric-title' }, 'Currently Inside'), section('div', { className: 'metric-value' }, String(inside)), section('div', { className: 'metric-sub' }, '+8% from last month')),
			section('div', { className: 'metric' }, section('div', { className: 'metric-title' }, 'Discharged'), section('div', { className: 'metric-value' }, String(discharged)), section('div', { className: 'metric-sub' }, '+15% from last month')),
			section('div', { className: 'metric' }, section('div', { className: 'metric-title' }, 'Evacuation Centers'), section('div', { className: 'metric-value' }, String(6)), section('div', { className: 'metric-sub' }, 'Active Centers')),
		),

		section(
			'div',
			{ className: 'charts-row', style: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: '16px', marginBottom: '16px' } },
			section('div', { className: 'chart-card' }, section('h3', null, 'Evacuees Trend'), section('div', { className: 'chart-placeholder' }, 'Trend chart removed')),
			section('div', { className: 'chart-card' }, section('h3', null, 'Evacuees by Evacuation Center'), section('div', { className: 'chart-placeholder' }, 'Donut chart removed'), section('div', { style: { marginTop: 8 } }, section('div', { className: 'donut-center-small' }, String(total))))
		),

		section(
			'div',
			{ className: 'lower-row', style: { display: 'grid', gridTemplateColumns: '320px 1fr 320px', gap: '16px' } },
			section('div', { className: 'panel' }, section('h3', null, 'Evacuees Summary'), section('ul', { className: 'summary-list' }, section('li', null, section('strong', null, 'Total Registered Evacuees'), section('span', null, String(total))), section('li', null, section('strong', null, 'Currently Inside'), section('span', null, String(inside))), section('li', null, section('strong', null, 'Discharged'), section('span', null, String(discharged))), section('li', null, section('strong', null, 'Deceased'), section('span', null, '0')), section('li', null, section('strong', null, 'Transferred'), section('span', null, '12')))),

			section('div', { className: 'panel' }, section('h3', null, 'Daily Breakdown (May 1 - May 31)'), section('div', { className: 'chart-placeholder' }, 'Daily chart removed'), section('a', { href: '#', className: 'view-full' }, 'View Full Report →')),

			section('div', { className: 'panel' }, section('h3', null, 'Recent Reports'), section('ul', { className: 'recent-list' }, ...recentReports.map((r) => section('li', { key: r.id }, section('div', null, section('strong', null, r.title), section('div', { className: 'report-time' }, r.time)), section('a', { href: '#', className: 'download' }, '⬇')))) ),
		),
	)
}

export default ReportPage
