type CostSummaryRow = {
  label: string;
  amount: number;
  squareFootage: number;
  totalProjectCost: number;
  constructionCost: number;
  durationMonths: number;
  bold?: boolean;
};

export default function ProjectCostSummaryTable({
  rows,
}: {
  rows: CostSummaryRow[];
}) {
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={labelHeader}></th>
          <th style={amountHeader}></th>
          <th style={metricHeader}>$/SF</th>
          <th style={metricHeader}>% Total</th>
          <th style={metricHeader}>% Construction</th>
          <th style={metricHeader}>$/Month</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => {
          const costPerSf = row.squareFootage
            ? row.amount / row.squareFootage
            : 0;

          const percentTotal = row.totalProjectCost
            ? row.amount / row.totalProjectCost
            : 0;

          const percentConstruction = row.constructionCost
            ? row.amount / row.constructionCost
            : 0;

          const costPerMonth = row.durationMonths
            ? row.amount / row.durationMonths
            : 0;

          return (
            <tr key={row.label}>
              <td style={labelCell(row.bold)}>{row.label}:</td>
              <td style={moneyCell(row.bold)}>{formatMoney(row.amount)}</td>
              <td style={moneyCell(row.bold)}>{formatMoney(costPerSf)}</td>
              <td style={percentCell(row.bold)}>{formatPercent(percentTotal)}</td>
              <td style={percentCell(row.bold)}>
                {formatPercent(percentConstruction)}
              </td>
              <td style={moneyCell(row.bold)}>{formatMoney(costPerMonth)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatMoney(value: number) {
  if (!value) return "$ -";
  return `$ ${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number) {
  if (!value) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

const table: React.CSSProperties = {
  borderCollapse: "collapse",
  minWidth: 900,
  background: "#cfcfcf",
};

const labelHeader: React.CSSProperties = {
  width: 230,
};

const amountHeader: React.CSSProperties = {
  width: 220,
};

const metricHeader: React.CSSProperties = {
  padding: "4px 10px",
  textAlign: "center",
  fontWeight: "bold",
};

function labelCell(bold?: boolean): React.CSSProperties {
  return {
    padding: "3px 8px",
    textAlign: "right",
    fontWeight: bold ? "bold" : "bold",
    color: "black",
    borderRight: "1px solid #333",
  };
}

function moneyCell(bold?: boolean): React.CSSProperties {
  return {
    padding: "3px 12px",
    textAlign: "right",
    fontWeight: bold ? "bold" : "normal",
    color: "black",
    borderRight: "1px dotted #333",
    minWidth: 130,
  };
}

function percentCell(bold?: boolean): React.CSSProperties {
  return {
    padding: "3px 12px",
    textAlign: "center",
    fontWeight: bold ? "bold" : "normal",
    color: "black",
    borderRight: "1px dotted #333",
    minWidth: 130,
  };
}