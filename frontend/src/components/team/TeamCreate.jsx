import React, { useEffect, useState } from "react";
import { TeamCreateModal } from "./TeamCreateModal";
import { TeamList } from "./TeamList";
import { authServices } from "../../auth";
const fetchMemberDetails = async (memberId) => {
  const response = await fetch(`http://localhost:4000/api/user/${memberId}`);
  const data = await response.json();
  return data;
};

// Fetch projects and associated members
const fetchProjectsAndMembers = async (
  userId,
  setProjects,
  setMembers,
  setLeader
) => {
  try {
    const response = await fetch(
      `http://localhost:4000/projects/user/${userId}`
    );
    const data = await response.json();
    setProjects(data);

    // Extract members from all projects where the user is a member
    const uniqueMembers = new Set();
    data.forEach((project) => {
      project.members.forEach((memberId) => uniqueMembers.add(memberId));
    });

    // Fetch details for unique members
    const membersData = await Promise.all(
      [...uniqueMembers].map((memberId) => fetchMemberDetails(memberId))
    );

    setMembers(membersData);
    setLeader(userId); // Default leader as current user
  } catch (error) {
    console.error("Error fetching projects and members:", error);
  }
};
export const TeamCreate = () => {
  const [projects, setProjects] = useState([]);
  const [leader, setLeader] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const currentUser = authServices.getAuthUser();
  const userId = currentUser ? currentUser._id : null;
  const handleTeamCreated = (newTeam) => {
    // Update teams array with the new team
    setTeams((prevTeams) => [...prevTeams, newTeam]);
  };
  const handleNewTeam = (newTeam) => {
    setTeams((prevTeams) => [...prevTeams, newTeam]); // Append new team to list
  };
  useEffect(() => {
    if (!userId) return;

    fetchProjectsAndMembers(userId, setProjects, setMembers, setLeader);
  }, [userId]);
  useEffect(() => {
    if (!userId) return;

    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/teams/my-teams/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch teams");

        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();
  }, [userId]);

  return (
    <div className="p-4 ">
      <div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-28 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Team
        </button>

        {isModalOpen && (
          <TeamCreateModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            members={members}
            setMembers={setMembers}
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            onTeamCreated={handleNewTeam} // Pass handler to update teams
            projects={projects}
            leader={leader}
            setLeader={setLeader}
            onCreateSuccess={handleTeamCreated}
          />
        )}
      </div>
      <div>
        <TeamList
          teams={teams}
          setTeams={setTeams}
          members={members}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
};
