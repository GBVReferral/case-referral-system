import { FaHome, FaBuilding, FaUsers, FaFileAlt, FaPlus } from "react-icons/fa";
import { GoOrganization } from "react-icons/go";
import { GiPapers } from "react-icons/gi";
import { FaUsersLine, FaUserGear, FaNewspaper } from "react-icons/fa6";
import { IoArrowRedo, IoArrowUndo } from "react-icons/io5";
import { RiBriefcase4Fill } from "react-icons/ri";
import { LuFilePlus2 } from "react-icons/lu";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Sidebar({ isOpen }) {

  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role || "");
        }
      }
    });

    return unsubscribe;
  }, []);
  return (


    <div className={`${isOpen ? "w-64" : "w-20"
      } bg-gray-800 h-screen p-5 pt-8 relative duration-300`}
    >
      <div className="flex gap-x-4 items-center">

        {isOpen && <h1 className="text-white  font-bold">GBV Referral System</h1>}
      </div>
      <br />
      <hr />
      <ul className="pt-6">

      
        <li className="cursor-pointer">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
            }
          >
            <FaHome />
            {isOpen && <span>Dashboard</span>}
          </NavLink>
        </li>
      


        {
          (role === "Administrator") && (
            <>
              <hr />

              <li className="cursor-pointer">
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <FaUsersLine />
                  {isOpen && <span>Users</span>}
                </NavLink>
              </li>
              <li className="cursor-pointer">
                <NavLink
                  to="/roles"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <FaUserGear />
                  {isOpen && <span>Roles</span>}
                </NavLink>
              </li>


              <li className="cursor-pointer">
                <NavLink
                  to="/create-organization"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <GoOrganization />
                  {isOpen && <span>Create Org</span>}
                </NavLink>
              </li>



              <li className="cursor-pointer">
                <NavLink
                  to="/organizations"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <FaBuilding />
                  {isOpen && <span>Organizations</span>}
                </NavLink>
              </li>
            </>
          )
        }
        <br />

        <hr />


        {
          (role === "Administrator" || role === "Focal Person") && (
            <>

              <li className="cursor-pointer">
                <NavLink
                  to="/master-referral-log"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <FaNewspaper />
                  {isOpen && <span>Master Referral Log</span>}
                </NavLink>
              </li>
            </>
          )
       }


        <li className="cursor-pointer">
          <NavLink
            to="/case-tracker-logs"
            className={({ isActive }) =>
              `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
            }
          >
            <GiPapers />
            {isOpen && <span>Case Tracker Logs</span>}
          </NavLink>
        </li>
        <hr />
        {
          (role === "Focal Person") && (
            <>
              <li className="cursor-pointer">
                <NavLink
                  to="/create-referral"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <LuFilePlus2 />
                  {isOpen && <span>Create Referral</span>}
                </NavLink>
              </li>

              <li className="cursor-pointer">
                <NavLink
                  to="/referrals-by-me"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <IoArrowUndo />
                  {isOpen && <span>Referral From Me</span>}
                </NavLink>
              </li>

              <li className="cursor-pointer">
                <NavLink
                  to="/referrals-to-me"
                  className={({ isActive }) =>
                    `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                  }
                >
                  <IoArrowRedo />
                  {isOpen && <span>Referral To Me</span>}
                </NavLink>
              </li>
            </>
          )
        }

        {(role === "Case Supervisor") && (
          <>

            <li className="cursor-pointer">
              <NavLink
                to="/my-assigned-cases"
                className={({ isActive }) =>
                  `flex items-center gap-x-4 p-2 rounded-md 
       ${isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"}`
                }
              >
                <RiBriefcase4Fill />
                {isOpen && <span>My Assigned Cases</span>}
              </NavLink>
            </li>

          </>

        )}

      </ul >

      {/* ✅ Real sticky footer at the absolute bottom */}
      <div className="text-center pt-5 text-gray-400 text-xs mt-4">
        © {new Date().getFullYear()} Case Referral System
      </div>
    </div >
  );
}
