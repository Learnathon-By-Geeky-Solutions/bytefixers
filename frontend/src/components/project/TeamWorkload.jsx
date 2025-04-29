import React, { useState, useEffect } from "react";
import { useMembers } from "../../context/MembersContext";
import { authServices } from "../../auth";

export const TeamWorkload = () => {
  const { allTasks, teams, members, loading, error } = useMembers();
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [availableTeams, setAvailableTeams] = useState([]);
  const currentUser = authServices.getAuthUser();
  const findUserById = (members, memberId) => {
    return members.find((u) => u._id === memberId);
  };

  // Function to process members if they exist and are in an array
  const processMembers = (members, memberId) => {
    if (members && Array.isArray(members)) {
      return findUserById(members, memberId);
    }
    return null;
  };
  // Function to add tasks to a member's workload
  const addTaskToWorkload = (memberWorkload, memberId, task) => {
    memberWorkload.get(memberId).tasks.push(task);
  };

  // Function to process each task and add it to the member's workload
  const processTasksForMember = (team, memberWorkload, memberId) => {
    team.tasks.forEach((task) => {
      addTaskToWorkload(memberWorkload, memberId, task);
    });
  };

  useEffect(() => {
    if (loading || !allTasks) {
      return;
    }

    try {
      // Step 1: Extract team information from tasks
      const teamsFromTasks = new Map();

      // Process all tasks to find teams
      allTasks.forEach((item) => {
        // Handle tasks array if available
        const tasksToProcess = Array.isArray(item.tasks) ? item.tasks : [item];

        tasksToProcess.forEach((task) => {
          if (!task?.team) return;

          const teamId =
            typeof task.team === "object" ? task.team._id : task.team;
          const teamName =
            typeof task.team === "object" ? task.team.name : `Team ${teamId}`;

          if (!teamsFromTasks.has(teamId)) {
            teamsFromTasks.set(teamId, {
              _id: teamId,
              name: teamName,
              members: new Set(),
              tasks: [],
            });
          }

          // Add task to this team
          teamsFromTasks.get(teamId).tasks.push(task);
        });
      });

      // Create list of available teams for filtering
      const teamOptions = Array.from(teamsFromTasks.values()).map((team) => ({
        _id: team._id,
        name: team.name,
      }));

      setAvailableTeams([{ _id: "all", name: "All Teams" }, ...teamOptions]);

      // Step 2: Add team members using the Team model structure
      if (teams && Array.isArray(teams)) {
        teams.forEach((team) => {
          const teamId = team._id;
          if (teamsFromTasks.has(teamId)) {
            // Add leader
            if (team.leader) {
              teamsFromTasks
                .get(teamId)
                .members.add(
                  typeof team.leader === "object"
                    ? team.leader._id
                    : team.leader
                );
            }

            // Add team members
            if (Array.isArray(team.teamMember)) {
              team.teamMember.forEach((member) => {
                teamsFromTasks
                  .get(teamId)
                  .members.add(
                    typeof member === "object" ? member._id : member
                  );
              });
            }
          }
        });
      }

      // Step 3: Calculate member workload data
      const memberWorkload = new Map();

      // Process each team's tasks and members
      teamsFromTasks.forEach((team) => {
        // For each team member

        team.members.forEach((memberId) => {
          if (!memberWorkload.has(memberId)) {
            // Initialize member data
            let memberName = "Unknown User";
            let memberEmail = "";
            let memberAvatar = null;

            // Try to find user details if available
            const user = processMembers(members, memberId);
            if (user) {
              memberName = user.name || user.username || "Unknown User";
              memberEmail = user.email || "";
              memberAvatar = user.avatar || null;
            }

            memberWorkload.set(memberId, {
              userId: memberId,
              name: memberName,
              email: memberEmail,
              avatar: memberAvatar,
              teams: new Set(),
              tasks: [],
            });
          }

          // Add this team to the member's teams
          memberWorkload.get(memberId).teams.add(team.name);

          // Add all team tasks to this member
          processTasksForMember(team, memberWorkload, memberId);
        });
      });

      // Step 4: Calculate statistics and format data
      const formattedWorkload = Array.from(memberWorkload.values()).map(
        (member) => {
          // Count tasks by status
          const todo = member.tasks.filter((t) => t.status === "TO DO").length;
          const inProgress = member.tasks.filter(
            (t) => t.status === "IN PROGRESS"
          ).length;
          const review = member.tasks.filter(
            (t) => t.status === "REVIEW"
          ).length;
          const done = member.tasks.filter((t) => t.status === "DONE").length;
          const total = member.tasks.length;

          // Calculate completion percentage
          const completionPercentage =
            total > 0 ? Math.round((done / total) * 100) : 0;

          return {
            userId: member.userId,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            teams: Array.from(member.teams),
            tasks: {
              total,
              todo,
              inProgress,
              review,
              done,
            },
            completionPercentage,
          };
        }
      );

      // Step 5: Sort by workload (total tasks) and filter out empty workloads
      const sortedWorkload = formattedWorkload
        .filter((member) => member.tasks.total > 0)
        .sort((a, b) => b.tasks.total - a.tasks.total);

      setTeamWorkload(sortedWorkload);
    } catch (err) {
      console.error("Error calculating team workload:", err);
    }
  }, [allTasks, teams, members, loading]);

  // Filter workload data by selected team
  const filteredWorkload =
    selectedTeam === "all"
      ? teamWorkload
      : teamWorkload.filter((member) =>
          member.teams.includes(
            availableTeams.find((t) => t._id === selectedTeam)?.name
          )
        );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="mb-2">Error loading team workload: {error}</p>
      </div>
    );
  }

  // No teams or workload
  if (availableTeams.length <= 1) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Team Workload</h2>
        <p className="text-gray-600 text-sm mb-1">
          View workload distribution across teams and members
        </p>
        <div className="text-center py-10 text-gray-500">
          No teams with tasks found in the system
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Team Workload</h2>
      <p className="text-gray-600 text-sm mb-6">
        View workload distribution across teams and members
      </p>

      {/* Team selector */}
      <div className="mb-6">
        <label
          htmlFor="team-selector"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Filter by team:
        </label>
        <select
          id="team-selector"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-60"
        >
          {availableTeams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Workload cards */}
      {filteredWorkload.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No team members found with assigned tasks
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-4" style={{ minWidth: "max-content" }}>
            {filteredWorkload.map((member) => (
              <div
                key={member.userId}
                className={`flex-shrink-0 w-64 border rounded-lg p-4 ${
                  member.userId === currentUser?._id
                    ? "bg-blue-30 border-blue-200"
                    : ""
                }`}
              >
                {/* User info */}
                <div className="flex items-center mb-4">
                  <div className="rounded-full w-12 h-12 bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {member.teams.join(", ")}
                    </div>
                  </div>
                  {member.userId === currentUser?._id && (
                    <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>

                {/* Task stats */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1 text-xs text-gray-600">
                    <span>Task completion</span>
                    <span className="font-medium">
                      {member.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${member.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Task counts */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg p-2 bg-blue-50">
                    <div className="font-bold text-blue-700">
                      {member.tasks.todo}
                    </div>
                    <div className="text-xs text-gray-600">To Do</div>
                  </div>
                  <div className="rounded-lg p-2 bg-yellow-50">
                    <div className="font-bold text-yellow-700">
                      {member.tasks.inProgress}
                    </div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="rounded-lg p-2 bg-green-50">
                    <div className="font-bold text-green-700">
                      {member.tasks.done}
                    </div>
                    <div className="text-xs text-gray-600">Done</div>
                  </div>
                </div>

                {/* Task distribution visual */}
                <div className="mt-4">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    {member.tasks.todo > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${
                            (member.tasks.todo / member.tasks.total) * 100
                          }%`,
                        }}
                      ></div>
                    )}
                    {member.tasks.inProgress > 0 && (
                      <div
                        className="bg-yellow-400"
                        style={{
                          width: `${
                            (member.tasks.inProgress / member.tasks.total) * 100
                          }%`,
                        }}
                      ></div>
                    )}
                    {member.tasks.done > 0 && (
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${
                            (member.tasks.done / member.tasks.total) * 100
                          }%`,
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-end text-sm">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-gray-600">To Do</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span className="text-gray-600">Done</span>
        </div>
      </div>
    </div>
  );
};
