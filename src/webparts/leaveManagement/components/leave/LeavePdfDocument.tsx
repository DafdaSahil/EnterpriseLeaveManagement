import * as React from "react";
import { Document, Page, View, StyleSheet, Text } from "@react-pdf/renderer";
import { getDateRange } from "../../utils/dateUtils";
import { ILeave } from "../../interfaces/ILeave";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#ffffff",
  },

  header: {
    marginBottom: 15,
  },

  title: {
    fontSize: 16,
    fontWeight: 700,
  },

  subtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 4,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginTop: 8,
  },

  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  employee: {
    fontSize: 11,
    fontWeight: 700,
  },

  email: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    fontSize: 7,
    color: "#fff",
  },

  row: {
    flexDirection: "row",
    marginTop: 5,
  },

  label: {
    width: 70,
    fontSize: 8,
    color: "#64748b",
  },

  value: {
    fontSize: 8,
  },

  reason: {
    marginTop: 8,
    fontSize: 8,
    color: "#475569",
  },
});

interface Props {
  leaves: ILeave[];
  getEmployeeName: (email: string) => string;
  employeeDepartmentMap: Record<string, string>;
}

export const LeavePdfDocument = ({
  leaves,
  getEmployeeName,
  employeeDepartmentMap,
}: Props): JSX.Element => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Leave Requests</Text>

          <Text style={styles.subtitle}>
            Generated on {new Date().toLocaleDateString()} | Total Requests:{" "}
            {leaves.length}
          </Text>

          <View style={styles.divider} />
        </View>

        {leaves.map((leave) => (
          <View key={leave.Id} style={styles.card} wrap={false}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.employee}>
                  {getEmployeeName(leave.EmployeeEmail)}
                </Text>

                <Text style={styles.email}>{leave.EmployeeEmail}</Text>
              </View>

              <View
                style={{
                  ...styles.badge,
                  backgroundColor:
                    leave.Status === "Approved"
                      ? "#16a34a"
                      : leave.Status === "Rejected"
                        ? "#dc2626"
                        : "#d97706",
                }}
              >
                <Text style={styles.badgeText}>{leave.Status}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Leave Type</Text>
              <Text style={styles.value}>{leave.LeaveType}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.value}>
                {employeeDepartmentMap[leave.EmployeeEmail] || "-"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>
                {getDateRange(leave.StartDate, leave.EndDate)}
              </Text>
            </View>

            <Text style={styles.reason}>Reason: {leave.Reason || "-"}</Text>
          </View>
        ))}

        <Text
          fixed
          style={{
            position: "absolute",
            bottom: 10,
            right: 20,
            fontSize: 8,
            color: "#64748b",
          }}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
};
