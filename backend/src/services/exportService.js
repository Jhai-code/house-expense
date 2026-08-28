const ExcelJS = require("exceljs");


/* =====================================================
   COMMON EXCEL HELPERS
   ===================================================== */

function styleHeader(row) {

  row.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  row.alignment = {
    vertical: "middle",
    horizontal: "center"
  };

  row.height = 28;


  row.eachCell(cell => {

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF173A70"
      }
    };


    cell.border = {

      top: {
        style: "thin",
        color: {
          argb: "FFD9E2F3"
        }
      },

      bottom: {
        style: "thin",
        color: {
          argb: "FFD9E2F3"
        }
      },

      left: {
        style: "thin",
        color: {
          argb: "FFD9E2F3"
        }
      },

      right: {
        style: "thin",
        color: {
          argb: "FFD9E2F3"
        }
      }

    };

  });

}


/* =====================================================
   ADD REPORT TITLE
   ===================================================== */

function addReportTitle(
  worksheet,
  title,
  columnCount
) {

  worksheet.mergeCells(
    1,
    1,
    1,
    columnCount
  );


  const cell =
    worksheet.getCell(
      1,
      1
    );


  cell.value =
    title;


  cell.font = {
    bold: true,
    size: 18,
    color: {
      argb: "FF173A70"
    }
  };


  cell.alignment = {
    vertical: "middle",
    horizontal: "left"
  };


  worksheet.getRow(
    1
  ).height = 32;

}


/* =====================================================
   ADD REPORT INFO
   ===================================================== */

function addReportInfo(
  worksheet,
  text,
  columnCount
) {

  worksheet.mergeCells(
    2,
    1,
    2,
    columnCount
  );


  const cell =
    worksheet.getCell(
      2,
      1
    );


  cell.value =
    text;


  cell.font = {
    size: 10,
    color: {
      argb: "FF64748B"
    }
  };


  cell.alignment = {
    vertical: "middle"
  };


  worksheet.getRow(
    2
  ).height = 22;

}


/* =====================================================
   ADD FILTER INFORMATION
   ===================================================== */

function addFilterInfo(
  worksheet,
  text,
  columnCount
) {

  worksheet.mergeCells(
    3,
    1,
    3,
    columnCount
  );


  const cell =
    worksheet.getCell(
      3,
      1
    );


  cell.value =
    text;


  cell.font = {
    size: 10,
    italic: true,
    color: {
      argb: "FF475569"
    }
  };


  cell.alignment = {
    vertical: "middle"
  };


  worksheet.getRow(
    3
  ).height = 22;

}


/* =====================================================
   APPLY BORDERS
   ===================================================== */

function applyBorders(
  worksheet
) {

  worksheet.eachRow(
    {
      includeEmpty: false
    },
    row => {

      row.eachCell(
        {
          includeEmpty: false
        },
        cell => {

          cell.border = {

            top: {
              style: "thin",
              color: {
                argb: "FFE2E8F0"
              }
            },

            bottom: {
              style: "thin",
              color: {
                argb: "FFE2E8F0"
              }
            },

            left: {
              style: "thin",
              color: {
                argb: "FFE2E8F0"
              }
            },

            right: {
              style: "thin",
              color: {
                argb: "FFE2E8F0"
              }
            }

          };

        }
      );

    }
  );

}


/* =====================================================
   AUTO WIDTH
   ===================================================== */

function autoWidth(
  worksheet,
  minimum = 12,
  maximum = 40
) {

  worksheet.columns.forEach(
    column => {

      let width =
        minimum;


      column.eachCell(
        {
          includeEmpty: false
        },
        cell => {

          const value =
            String(
              cell.value ?? ""
            );


          width =
            Math.max(
              width,
              value.length + 2
            );

        }
      );


      column.width =
        Math.min(
          width,
          maximum
        );

    }
  );

}


/* =====================================================
   TRANSACTION WORKBOOK
   ===================================================== */

async function createTransactionWorkbook(
  rows,
  columns = []
) {

  const workbook =
    new ExcelJS.Workbook();


  workbook.creator =
    "HouseLedger";


  workbook.lastModifiedBy =
    "HouseLedger";


  workbook.created =
    new Date();


  const worksheet =
    workbook.addWorksheet(
      "Transactions"
    );


  const availableColumns = {

    date: {
      header: "Date",
      key: "date"
    },

    description: {
      header: "Description",
      key: "description"
    },

    category: {
      header: "Category",
      key: "category"
    },

    credit: {
      header: "Credit",
      key: "credit"
    },

    debit: {
      header: "Debit",
      key: "debit"
    },

    balance: {
      header: "Balance",
      key: "balance"
    },

    notes: {
      header: "Notes",
      key: "notes"
    }

  };


  const selectedColumns =
    columns.length
      ? columns.filter(
          column =>
            availableColumns[column]
        )
      : [
          "date",
          "description",
          "category",
          "credit",
          "debit",
          "balance"
        ];


  /*
    Title
  */

  addReportTitle(
    worksheet,
    "HouseLedger — Transaction Report",
    selectedColumns.length
  );


  /*
    Export timestamp
  */

  addReportInfo(
    worksheet,
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    selectedColumns.length
  );


  /*
    Filter information
  */

  addFilterInfo(
    worksheet,
    `Records exported: ${rows.length}`,
    selectedColumns.length
  );


  /*
    Header begins at row 5
  */

  worksheet.getRow(
    5
  ).values =
    selectedColumns.map(
      column =>
        availableColumns[column]
          .header
    );


  worksheet.columns =
    selectedColumns.map(
      column => ({
        key:
          availableColumns[column]
            .key,

        width: 16
      })
    );


  /*
    ExcelJS needs headers after
    setting columns.
  */

  selectedColumns.forEach(
    (column, index) => {

      worksheet.getCell(
        5,
        index + 1
      ).value =
        availableColumns[column]
          .header;

    }
  );


  styleHeader(
    worksheet.getRow(5)
  );


  /*
    Add rows
  */

  rows.forEach(
    row => {

      const values = {};


      selectedColumns.forEach(
        column => {

          if (
            column === "credit"
          ) {

            values[column] =
              row.type === "credit"
                ? Number(row.amount)
                : 0;

          } else if (
            column === "debit"
          ) {

            values[column] =
              row.type === "debit"
                ? Number(row.amount)
                : 0;

          } else {

            values[column] =
              row[column] ?? "";

          }

        }
      );


      worksheet.addRow(
        values
      );

    }
  );


  /*
    Date formatting
  */

  if (
    selectedColumns.includes(
      "date"
    )
  ) {

    worksheet.getColumn(
      "date"
    ).numFmt =
      "dd-mmm-yyyy";

  }


  /*
    Currency formatting
  */

  [
    "credit",
    "debit",
    "balance"
  ].forEach(
    column => {

      if (
        selectedColumns.includes(
          column
        )
      ) {

        worksheet.getColumn(
          column
        ).numFmt =
          '₹#,##0.00';

      }

    }
  );


  /*
    Freeze header
  */

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 5
    }
  ];


  /*
    Enable filter
  */

  worksheet.autoFilter = {

    from: {
      row: 5,
      column: 1
    },

    to: {
      row: 5,
      column:
        selectedColumns.length
    }

  };


  /*
    Total row
  */

  if (
    rows.length > 0
  ) {

    const totalRow =
      worksheet.addRow([]);


    totalRow.font = {
      bold: true
    };


    const creditIndex =
      selectedColumns.indexOf(
        "credit"
      );


    const debitIndex =
      selectedColumns.indexOf(
        "debit"
      );


    if (
      creditIndex >= 0
    ) {

      worksheet.getCell(
        totalRow.number,
        creditIndex + 1
      ).value =
        {
          formula:
            `SUM(${worksheet.getColumn(creditIndex + 1).letter}6:${worksheet.getColumn(creditIndex + 1).letter}${totalRow.number - 1})`
        };

    }


    if (
      debitIndex >= 0
    ) {

      worksheet.getCell(
        totalRow.number,
        debitIndex + 1
      ).value =
        {
          formula:
            `SUM(${worksheet.getColumn(debitIndex + 1).letter}6:${worksheet.getColumn(debitIndex + 1).letter}${totalRow.number - 1})`
        };

    }


    worksheet.getCell(
      totalRow.number,
      1
    ).value =
      "TOTAL";


    totalRow.eachCell(
      cell => {

        cell.font = {
          bold: true
        };

      }
    );

  }


  applyBorders(
    worksheet
  );


  autoWidth(
    worksheet
  );


  return workbook;

}

async function createLabourWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "HouseLedger";
  workbook.lastModifiedBy = "HouseLedger";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Daily Labour");

  const columns = 5;

  /* =====================================================
     REPORT HEADER
     ===================================================== */

  addReportTitle(
    worksheet,
    "HouseLedger — Daily Labour Report",
    columns
  );

  addReportInfo(
    worksheet,
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    columns
  );

  addFilterInfo(
    worksheet,
    "Labour categories: Kothanar · Nimdhal · Sithal",
    columns
  );


  /* =====================================================
     COLUMN SETUP
     ===================================================== */

  worksheet.columns = [
    {
      header: "Date",
      key: "date",
      width: 16
    },
    {
      header: "Kothanar",
      key: "kothanar",
      width: 18
    },
    {
      header: "Nimdhal",
      key: "nimdhal",
      width: 18
    },
    {
      header: "Sithal",
      key: "sithal",
      width: 18
    },
    {
      header: "Total",
      key: "total",
      width: 18
    }
  ];


  /* =====================================================
     HEADER ROW
     ===================================================== */

  worksheet.getRow(5).values = [
    "Date",
    "Kothanar",
    "Nimdhal",
    "Sithal",
    "Total"
  ];

  styleHeader(
    worksheet.getRow(5)
  );


  /* =====================================================
     GROUP LABOUR BY DATE
     ===================================================== */

  const dailyLabour = {};

  rows.forEach(row => {
    const date = row.date;

    if (!date) {
      return;
    }

    if (!dailyLabour[date]) {
      dailyLabour[date] = {
        date,
        kothanar: 0,
        nimdhal: 0,
        sithal: 0
      };
    }

    const amount =
      Number(row.amount) || 0;

    const category =
      String(row.category || "")
        .trim()
        .toLowerCase();

    if (category === "kothanar") {
      dailyLabour[date].kothanar += amount;
    }

    if (category === "nimdhal") {
      dailyLabour[date].nimdhal += amount;
    }

    if (category === "sithal") {
      dailyLabour[date].sithal += amount;
    }
  });


  /* =====================================================
     ADD DAILY ROWS
     ===================================================== */

  Object.values(dailyLabour)
    .sort((a, b) =>
      String(a.date).localeCompare(
        String(b.date)
      )
    )
    .forEach(day => {

      const total =
        day.kothanar +
        day.nimdhal +
        day.sithal;

      worksheet.addRow({
        date: day.date,
        kothanar: day.kothanar,
        nimdhal: day.nimdhal,
        sithal: day.sithal,
        total
      });

    });


  /* =====================================================
     DATE FORMAT
     ===================================================== */

  worksheet.getColumn("date").numFmt =
    "dd-mmm-yyyy";


  /* =====================================================
     CURRENCY FORMAT
     ===================================================== */

  [
    "kothanar",
    "nimdhal",
    "sithal",
    "total"
  ].forEach(column => {

    worksheet.getColumn(column).numFmt =
      '₹#,##0.00';

  });


  /* =====================================================
     TOTAL ROW
     ===================================================== */

  if (worksheet.rowCount > 5) {

    const totalRow =
      worksheet.addRow([]);

    totalRow.font = {
      bold: true
    };

    const firstDataRow = 6;
    const lastDataRow =
      totalRow.number - 1;

    totalRow.getCell(1).value =
      "TOTAL";

    totalRow.getCell(2).value = {
      formula:
        `SUM(B${firstDataRow}:B${lastDataRow})`
    };

    totalRow.getCell(3).value = {
      formula:
        `SUM(C${firstDataRow}:C${lastDataRow})`
    };

    totalRow.getCell(4).value = {
      formula:
        `SUM(D${firstDataRow}:D${lastDataRow})`
    };

    totalRow.getCell(5).value = {
      formula:
        `SUM(E${firstDataRow}:E${lastDataRow})`
    };

    totalRow.height = 24;

    [
      2,
      3,
      4,
      5
    ].forEach(column => {
      worksheet.getCell(
        totalRow.number,
        column
      ).numFmt = '₹#,##0.00';
    });

  }


  /* =====================================================
     FREEZE HEADER
     ===================================================== */

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 5
    }
  ];


  /* =====================================================
     EXCEL FILTER
     ===================================================== */

  worksheet.autoFilter = {
    from: {
      row: 5,
      column: 1
    },

    to: {
      row: 5,
      column: 5
    }
  };


  /* =====================================================
     BORDERS
     ===================================================== */

  applyBorders(
    worksheet
  );


  /* =====================================================
     AUTO WIDTH
     ===================================================== */

  autoWidth(
    worksheet,
    14,
    30
  );


   return workbook;
}


/* =====================================================
   EXPORT SERVICE FUNCTIONS
   ===================================================== */

module.exports = {
  createTransactionWorkbook,
  createLabourWorkbook
};