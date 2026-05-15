"use client";
import React, { useState, useEffect } from "react";
import { detectToken } from "@/lib/blockchain/detectToken";
import { generateTokenId } from "@/lib/utils";

interface Token {
  id?: string;
  name: string;
  symbol: string;
  contractAddress: string;
  decimals: number;
  tokenId: string;
  chainId: number;
}

const TokenManagementComp: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const lastid = tokens.length > 0 ? tokens[0].tokenId : "";
  const [newToken, setNewToken] = useState<Token>({
    name: "",
    symbol: "",
    contractAddress: "",
    decimals: 18,
    tokenId: "0",
    chainId: 0,
  });
  const [detectingToken, setDetectingToken] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tokens",{
        method: "GET",
        headers: { "Content-Type": "application/json" },
    }
      );
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
    setLoading(false);
  };
  const handleDetectToken = async () => {
    try {
      setDetectingToken(true);

      const token = await detectToken(newToken.contractAddress, false);

      setNewToken({
        name: token.name,
        symbol: token.symbol,
        contractAddress: token.contractAddress,
        decimals: token.decimals,
        tokenId: generateTokenId(lastid),
        chainId: token.chainId,
      });
    } catch (error: any) {
      console.error(error);

      alert(error.message || "Failed to detect token");
    } finally {
      setDetectingToken(false);
    }
  };

  const addToken = async () => {
    try {
      if (!newToken.name || !newToken.symbol || !newToken.contractAddress) {
        alert("Detect token first");

        return;
      }
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newToken),
      });
      if (response.ok) {
        setNewToken({
          name: "",
          symbol: "",
          contractAddress: "",
          decimals: 18,
          tokenId: generateTokenId(lastid),
          chainId: 0,
        });
        fetchTokens();
      }
    } catch (error) {
      console.error("Error adding token:", error);
    }
  };

  const updateToken = async (token: Token) => {
    try {
      const response = await fetch(`/api/tokens/${token.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token),
      });
      if (response.ok) {
        setEditingToken(null);
        fetchTokens();
      }
    } catch (error) {
      console.error("Error updating token:", error);
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const response = await fetch(`/api/tokens/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error("Error deleting token:", error);
    }
  };

  const handleEdit = (token: Token) => {
    setEditingToken(token);
  };

  const handleEditChange = (field: keyof Token, value: string) => {
    if (editingToken) {
      setEditingToken({ ...editingToken, [field]: value });
    }
  };

  return (
    <div className="token-management">
      <div className="card hero-card">
        <div className="hero-content">
          <h2>Token Management</h2>
          <p>
            Manage your token list with a clean interface for adding, editing,
            and removing tokens.
          </p>
        </div>
      </div>

      <div className="grid">
        <section className="card form-card">
          <h3>Add New Token</h3>
          <div className="field-row">
            <label>
              Name
              <input
                type="text"
                disabled={true}
                value={newToken.name}
                onChange={(e) =>
                  setNewToken({ ...newToken, name: e.target.value })
                }
              />
            </label>
            <label>
              Symbol
              <input
                type="text"
                disabled={true}
                value={newToken.symbol}
                onChange={(e) =>
                  setNewToken({ ...newToken, symbol: e.target.value })
                }
              />
            </label>
            <label>
              Decimals
              <input type="number" disabled value={newToken.decimals} />
            </label>

            <label>
              Chain ID
              <input type="number" disabled value={newToken.chainId} />
            </label>

            
            <label>
              Token ID
              <input
                type="text"
                placeholder="011"
                value={newToken.tokenId}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    tokenId: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Contract Address
              <input
                type="text"
                placeholder="0x..."
                value={newToken.contractAddress}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    contractAddress: e.target.value,
                  })
                }
              />
            </label>

            <button
              type="button"
              className="primary-button"
              onClick={handleDetectToken}
              disabled={detectingToken || !newToken.contractAddress}
            >
              {detectingToken ? "Detecting..." : "Detect Token"}
            </button>
          </div>

          <button className="primary-button" onClick={addToken} disabled={!newToken.name || !newToken.symbol || !newToken.contractAddress}>
            Add Token
          </button>
        </section>

        <section className="card tokens-card">
          <h3>Existing Tokens</h3>
          {loading ? (
            <p className="status">Loading tokens...</p>
          ) : (
            tokens.length === 0 ? (
              <p className="status">No tokens added yet.</p>
            ) : (
              <ul className="token-list">
                {tokens.map((token) => (
                  <li key={token.id} className="token-item">
                    {editingToken && editingToken.id === token.id ? (
                      <div className="edit-row">
                      <input
                        type="text"
                        value={editingToken.name}
                        onChange={(e) =>
                          handleEditChange("name", e.target.value)
                        }
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editingToken.symbol}
                        onChange={(e) =>
                          handleEditChange("symbol", e.target.value)
                        }
                        placeholder="Symbol"
                      />
                      <input
                        type="text"
                        value={editingToken.contractAddress}
                        onChange={(e) =>
                          handleEditChange("contractAddress", e.target.value)
                        }
                        placeholder="Contract Address"
                      />
                      <div className="token-actions">
                        <button
                          className="action-button primary-button"
                          onClick={() => updateToken(editingToken)}
                        >
                          Save
                        </button>
                        <button
                          className="action-button secondary"
                          onClick={() => setEditingToken(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="token-info">
                        <strong>
                          {token.name} ({token.symbol})
                        </strong>
                        <span>{token.contractAddress}</span>
                      </div>
                      <div className="token-actions">
                        <button
                          className="action-button secondary"
                          onClick={() => handleEdit(token)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-button danger"
                          onClick={() => deleteToken(token.id as string)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            )
          )}
        </section>
      </div>

      <style jsx>{`
        .token-management {
          max-width: 1040px;
          margin: 32px auto;
          padding: 0 20px 40px;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .hero-card {
          background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
          padding: 28px 26px;
          border-radius: 22px;
          box-shadow: 0 24px 70px rgba(79, 70, 229, 0.16);
          margin-bottom: 28px;
        }

        .hero-card h2 {
          margin: 0 0 10px;
          font-size: clamp(1.9rem, 2.4vw, 2.5rem);
          line-height: 1.05;
        }

        .hero-card p {
          margin: 0;
          max-width: 720px;
          font-size: 1rem;
          line-height: 1.7;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
        }

        @media (max-width: 860px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid #eef2ff;
        }

        h3 {
          margin: 0 0 18px;
          font-size: 1.05rem;
          letter-spacing: -0.02em;
        }

        .field-row {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.94rem;
        }

        input {
          width: 100%;
          min-height: 48px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          font-size: 0.98rem;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        .primary-button,
        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-size: 0.96rem;
          font-weight: 600;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background-color 0.18s ease;
        }

        .primary-button {
          width: 100%;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
        }

        .primary-button:hover,
        .action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
        }

        .secondary {
          color: #374151;
        }

        .danger {
          color: #b91c1c;
        }

        .tokens-card {
          min-height: 380px;
        }

        .token-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 14px;
        }

        .token-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 18px 18px;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
        }

        .token-info {
          min-width: 0;
        }

        .token-info strong {
          display: block;
          margin-bottom: 6px;
          font-size: 1rem;
        }

        .token-info span {
          font-size: 0.95rem;
          word-break: break-all;
        }

        .token-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
        }

        .edit-row {
          width: 100%;
          display: grid;
          gap: 12px;
        }

        .status {
          margin: 0;
          padding: 18px 0;
        }
      `}</style>
    </div>
  );
};

export default TokenManagementComp;
