import { useAuth } from "./contexts/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import SignIn from "./pages/SignIn";
import CreateOrganization from "./pages/CreateOrganization";
import OrganizationsList from "./pages/OrganizationsList";
import EditOrganization from "./pages/EditOrganization";
import AddUser from "./pages/AddUser";
import UserList from "./pages/UserList";
import RoleList from "./pages/RoleList";
import CreateReferral from "./pages/CreateReferral";
import ReferralList from "./pages/ReferralList";
import EditReferral from "./pages/EditReferral";
import ReferralDetail from "./pages/ReferralDetail";
import NotAuthorized from "./pages/NotAuthorized";
import ReferredToMe from "./pages/ReferredToMe";
import ReferredByMe from "./pages/ReferredByMe";
import ProtectedRoute from "./components/ProtectedRoute";
import TrackerList from "./pages/TrackerList";
import AssignSupervisor from "./pages/AssignSupervisor";
import MyAssignedCases from "./pages/MyAssignedCases";
import CaseTrackerLogs from "./pages/CaseTrackerLogs";
import Dashboard from "./pages/Dashboard";
import ContactDeveloperPage from "./pages/ContactDeveloperPage";



function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/*  PUBLIC routes */}
        <Route path="/login" element={<SignIn />} />


        {/* PROTECTED routes */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AdminLayout>
                <Routes>
                  
                  <Route path="/"  element={<Dashboard />} />
                  <Route
                    path="/create-organization" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <CreateOrganization />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/organizations" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <OrganizationsList />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/edit-organization/:id" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <EditOrganization />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/secret-admin-add-user" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <AddUser />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/users" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <UserList />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/roles" element={
                      <ProtectedRoute allowedRoles={["Administrator"]}>
                        <RoleList />
                      </ProtectedRoute>
                    }
                  />



                  <Route
                    path="/create-referral"
                    element={
                      <ProtectedRoute allowedRoles={["Focal Person"]}>
                        <CreateReferral />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/master-referral-log"
                    element={
                      <ProtectedRoute allowedRoles={["Administrator", "Focal Person"]}>
                        <ReferralList />
                      </ProtectedRoute>
                    }
                  />


                  <Route
                    path="/master-referral-log/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={["Administrator", "Focal Person"]}>
                        <EditReferral />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/master-referral-log/:id" element={
                      <ProtectedRoute allowedRoles={["Administrator", "Focal Person"]}>
                        <ReferralDetail />
                      </ProtectedRoute>

                    }
                  />

                  <Route
                    path="/referrals-to-me" element={
                      <ProtectedRoute allowedRoles={["Focal Person"]}>
                        <ReferredToMe />
                      </ProtectedRoute>

                    }
                  />
                  <Route
                    path="/referrals-by-me" element={
                      <ProtectedRoute allowedRoles={["Focal Person"]}>
                        <ReferredByMe />
                      </ProtectedRoute>

                    }
                  />

                  <Route
                    path="/tracker" element={
                      <ProtectedRoute allowedRoles={["Focal Person", "Case Supervisor"]}>
                        <TrackerList />
                      </ProtectedRoute>

                    }
                  />

                  <Route
                    path="/my-assigned-cases" element={
                      <ProtectedRoute allowedRoles={["Case Supervisor"]}>
                        <MyAssignedCases />
                      </ProtectedRoute>

                    }



                  />

                  <Route path="/case-tracker-logs" element={<CaseTrackerLogs />} />
                  <Route path="/contact-developer" element={<ContactDeveloperPage />} />

                  <Route path="/not-authorized" element={<NotAuthorized />} />
                </Routes>
              </AdminLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
