"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  bidVolumeData: { month: string; volume: number }[];
  projectsData: { month: string; created: number; awarded: number }[];
  usersData: { week: string; clients: number; contractors: number }[];
};

const tooltipStyle = {
  background: "#0A1628",
  border: "1px solid #1B4F8A",
  borderRadius: "6px",
  color: "#F0F4FF",
  fontSize: "12px",
};

const labelStyle = {
  fontSize: "11px",
  color: "#7A9CC4",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

export default function AdminCharts({ bidVolumeData, projectsData, usersData }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* User signups chart */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          New User Signups
        </h2>
        <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "20px" }}>
          Weekly signups by role — last 12 weeks
        </p>
        {usersData.length === 0 ? (
          <div style={{ textAlign: "center", color: "#3A5A7A", fontSize: "13px", padding: "40px 0" }}>
            No signup data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B4F8A" />
              <XAxis dataKey="week" tick={{ fill: "#7A9CC4", fontSize: 11 }} />
              <YAxis tick={{ fill: "#7A9CC4", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={labelStyle} />
              <Line type="monotone" dataKey="clients" stroke="#60A5FA" strokeWidth={2} dot={false} name="Clients" />
              <Line type="monotone" dataKey="contractors" stroke="#4ADE80" strokeWidth={2} dot={false} name="Contractors" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Projects chart */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Project Activity
        </h2>
        <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "20px" }}>
          Projects created vs awarded — last 12 months
        </p>
        {projectsData.length === 0 ? (
          <div style={{ textAlign: "center", color: "#3A5A7A", fontSize: "13px", padding: "40px 0" }}>
            No project data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B4F8A" />
              <XAxis dataKey="month" tick={{ fill: "#7A9CC4", fontSize: 11 }} />
              <YAxis tick={{ fill: "#7A9CC4", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={labelStyle} />
              <Bar dataKey="created" fill="#1B4F8A" name="Created" radius={[4, 4, 0, 0]} />
              <Bar dataKey="awarded" fill="#4ADE80" name="Awarded" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bid volume chart */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Bid Volume
        </h2>
        <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "20px" }}>
          Total dollar value of bids submitted per month — last 12 months
        </p>
        {bidVolumeData.length === 0 ? (
          <div style={{ textAlign: "center", color: "#3A5A7A", fontSize: "13px", padding: "40px 0" }}>
            No bid volume data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bidVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B4F8A" />
              <XAxis dataKey="month" tick={{ fill: "#7A9CC4", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#7A9CC4", fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Bid Volume"]}
              />
              <Bar dataKey="volume" fill="#C8102E" name="Bid Volume" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}