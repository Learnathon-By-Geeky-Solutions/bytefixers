import { useState } from "react";
import { Button, Input } from "../icons";
import axios from "axios";
import PropTypes from "prop-types";

export const InviteModal = ({ isOpen, onClose, projectid }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleInvite = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/sendEmail/send-invite`,
        {
          email,
          projectId: projectid,
        }
      );

      setMessage(response.data.message);
    } catch (error) {
      console.error("Invite error:", error);
      setMessage("Failed to send invitation");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Invite User</h2>
        <Input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleInvite} disabled={loading}>
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </div>
        {message && <p className="mt-2 text-sm">{message}</p>}
      </div>
    </div>
  );
};
InviteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectid: PropTypes.string.isRequired, // or PropTypes.number if that's what it is
};
