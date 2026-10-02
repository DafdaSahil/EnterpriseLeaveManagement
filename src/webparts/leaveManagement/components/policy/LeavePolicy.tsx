import * as React from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import { LEAVE_TYPES } from "../../utils/constants";
import {
  POLICY_FOOTER,
  POLICY_HIGHLIGHTS,
  POLICY_SECTIONS,
} from "../../utils/leavePolicy";
import "./leave-policy.css";

const BookIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ClockIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CalendarIcon = (): JSX.Element => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const LeavePolicy = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  const isEmployee = user?.Role === "Employee";

  return (
    <MainLayout>
      <div className="policyPage">
        {/* Page Header */}
        <div className="policyHeader">
          <div>
            <h1 className="policyTitle">Leave Policy</h1>
            <p className="policySubtitle">
              How leave works at LMS Portal - allowances, rules, and how
              requests are handled
            </p>
          </div>

          <div className="policyActions">
            {isEmployee && (
              <button
                className="policyBtn primary"
                type="button"
                onClick={() => navigate("/apply-leave")}
              >
                Apply for leave
              </button>
            )}
            <button
              className="policyBtn"
              type="button"
              onClick={() => navigate("/holiday-calendar")}
            >
              Holiday calendar
            </button>
          </div>
        </div>

        {/* At a glance */}
        <div className="policyHighlights">
          {POLICY_HIGHLIGHTS.map((highlight) => (
            <div className="policyHighlight" key={highlight.label}>
              <div className="policyHighlightIcon" aria-hidden="true">
                {highlight.label === "Half Days" ? (
                  <ClockIcon />
                ) : (
                  <BookIcon />
                )}
              </div>
              <div className="policyHighlightValue">{highlight.value}</div>
              <div className="policyHighlightLabel">{highlight.label}</div>
            </div>
          ))}
        </div>

        {/* Allowance table */}
        <section className="policySection">
          <div className="policySectionHeader">
            <h2 className="policySectionTitle">Annual allowances</h2>
            <span className="policySectionMeta">Per calendar year</span>
          </div>

          <div className="policyTableWrap">
            <table className="policyTable">
              <thead>
                <tr>
                  <th scope="col">Leave type</th>
                  <th scope="col">Allowance</th>
                  <th scope="col">Typically used for</th>
                </tr>
              </thead>
              <tbody>
                {LEAVE_TYPES.map((type) => (
                  <tr key={type.value}>
                    <td className="policyTableType">{type.label}</td>
                    <td>
                      {type.daysAllowed > 0 ? (
                        <span className="policyTableDays">
                          {type.daysAllowed} days
                        </span>
                      ) : (
                        <span className="policyTableOnDemand">On approval</span>
                      )}
                    </td>
                    <td className="policyTableNote">
                      {type.label === "Casual Leave"
                        ? "Personal errands, family events, short unplanned breaks"
                        : type.label === "Sick Leave"
                          ? "Your illness, or caring for an immediate family member"
                          : type.label === "Earned Leave"
                            ? "Planned holidays, travel, extended time away"
                            : "Cases beyond your paid allowance, with prior approval"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Policy sections */}
        {POLICY_SECTIONS.map((section) => (
          <section className="policySection" key={section.id}>
            <div className="policySectionHeader">
              <h2 className="policySectionTitle">{section.title}</h2>
            </div>

            <p className="policySectionSummary">{section.summary}</p>

            <ul className="policyList">
              {section.points.map((point, index) => (
                <li className="policyListItem" key={`${section.id}-${index}`}>
                  <span className="policyListIcon" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Footer note */}
        <div className="policyFooterCard">
          <div className="policyFooterIcon" aria-hidden="true">
            <CalendarIcon />
          </div>
          <p className="policyFooterText">{POLICY_FOOTER}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default LeavePolicy;