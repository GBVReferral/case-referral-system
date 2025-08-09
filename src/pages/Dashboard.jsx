import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import Papa from "papaparse";

const Dashboard = () => {
  const [referrals, setReferrals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("All");

  const [selectedMonth, setSelectedMonth] = useState("All");
  const [months, setMonths] = useState(["All"]);

  const chartRef = useRef(null);

  // Load referrals
  useEffect(() => {
    const fetchReferrals = async () => {
      const snapshot = await getDocs(collection(db, "referrals"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReferrals(data);
      setLoading(false);
    };
    fetchReferrals();
  }, []);

  // Extract dynamic months from referral dates
  useEffect(() => {
    const uniqueMonths = new Set();

    referrals.forEach((r) => {
      const date = r.dateOfReferral?.toDate?.();
      if (date) {
        const monthYear = dayjs(date).format("MMMM YYYY"); // e.g., "January 2026"
        uniqueMonths.add(monthYear);
      }
    });

    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => {
      return dayjs(a, "MMMM YYYY").isAfter(dayjs(b, "MMMM YYYY")) ? 1 : -1;
    });

    setMonths(["All", ...sortedMonths]);
  }, [referrals]);

  // Load users, roles, orgs
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);

      const uniqueRoles = Array.from(
        new Set(data.map((u) => u.role).filter(Boolean))
      );
      setRoles(uniqueRoles);

      const uniqueOrgs = Array.from(
        new Set(data.map((u) => u.organization).filter(Boolean))
      );
      setOrgs(uniqueOrgs);
    };
    fetchUsers();
  }, []);

  // Filter referrals
  useEffect(() => {
    let temp = [...referrals];

    if (selectedMonth !== "All") {
      const [monthName, year] = selectedMonth.split(" ");
      const monthIndex = dayjs().month(monthName).month(); // 0-based index
      temp = temp.filter((r) => {
        const date = r.dateOfReferral?.toDate?.();
        return (
          date &&
          dayjs(date).month() === monthIndex &&
          dayjs(date).year() === parseInt(year)
        );
      });
    }

    if (selectedOrg !== "All") {
      temp = temp.filter((r) => r.createdByOrg === selectedOrg);
    }

    setFiltered(temp);
  }, [referrals, selectedMonth, selectedOrg]);

  // Stats
  const totalReferrals = filtered.length;
  const approved = filtered.filter((r) => r.status === "Approved").length;
  const waiting = filtered.filter((r) => r.status === "Waiting...").length;
  const assigned = filtered.filter((r) => r.status === "Assigned").length;
  const rejected = filtered.filter((r) => r.status === "Rejected").length;
  const closed = filtered.filter((r) => r.caseStatus === "Closed").length;
  const onHold = filtered.filter((r) => r.caseStatus === "On Hold").length;
  const dismissed = filtered.filter((r) => r.caseStatus === "Dismissed").length;
  const inProgress = filtered.filter((r) =>
    r.caseStatus?.startsWith("In Progress")
  ).length;

  const barData = [
    { status: "On Hold", count: onHold },
    { status: "Closed", count: closed },
    { status: "Dismissed", count: dismissed },
    { status: "In Progress", count: inProgress },
  ];

  const groupedByDate = filtered.reduce((acc, curr) => {
    const date = dayjs(curr.dateOfReferral?.toDate?.() || new Date()).format(
      "YYYY-MM-DD"
    );
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {});

  const lineData = Object.keys(groupedByDate)
    .sort()
    .map((date) => ({ date, count: groupedByDate[date] }));

  const handleExportCSV = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "referrals.csv");
  };

  const handleDownloadPNG = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      canvas.toBlob((blob) => {
        saveAs(blob, "chart.png");
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div>
          <label className="block text-sm mb-1">Filter by Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Organization:</label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="border p-2 rounded"
          >
            <option>All</option>
            {orgs.map((org) => (
              <option key={org}>{org}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Export to format</label>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Export CSV
          </button>
        </div>
        <div>
          <label className="block text-sm mb-1">Export to format</label>
          <button
            onClick={handleDownloadPNG}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Download PNG
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <>
          {/* Stat Boxes */}
          <h2 className="text-xl font-bold mb-2">Org Info & Case Statuses</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 ">
            <div className="border border-b-gray-500 p-4 bg-white rounded shadow text-center">
              <p className="text-sm text-gray-500">Total Referrals</p>
              <p className="text-2xl font-bold">{totalReferrals}</p>
            </div>

            <div className="p-4 bg-blue-100 rounded shadow text-center">
              <p className="text-sm text-blue-700">Total Orgs</p>
              <p className="text-2xl font-bold">{orgs.length}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded shadow text-center">
              <p className="text-sm text-blue-700">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded shadow text-center">
              <p className="text-sm text-blue-700">Unique Roles</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
            <div className="p-4 bg-green-100 rounded shadow text-center">
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-2xl font-bold">{approved}</p>
            </div>
            <div className="p-4 bg-red-100 rounded shadow text-center">
              <p className="text-sm text-red-700">Rejected</p>
              <p className="text-2xl font-bold">{rejected}</p>
            </div>
            <div className="p-4 bg-yellow-100 rounded shadow text-center">
              <p className="text-sm text-yellow-700">Waiting</p>
              <p className="text-2xl font-bold">{waiting}</p>
            </div>
            <div className="p-4 bg-orange-100 rounded shadow text-center">
              <p className="text-sm text-yellow-700">Assigned</p>
              <p className="text-2xl font-bold">{assigned}</p>
            </div>
          </div>

          <div ref={chartRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Line Chart */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-2">Referrals Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-2">Cases Status indicators</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
