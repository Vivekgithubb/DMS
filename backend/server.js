const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

// app.use(cors());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vivek@20052005",
  database: "amusementpark",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database Connected");
});

module.exports = db;

app.get("/", (req, res) => {
  return res.json("Hello WOrld Backend side");
});

app.get("/Attractions", (req, res) => {
  const attraction = "select * from Attractions";
  db.query(attraction, (err, data) => {
    if (err) return res.json(err);
    else {
      return res.json(data);
    }
  });
});
app.get("/Staff", (req, res) => {
  const staff = "select * from Staff";
  db.query(staff, (err, data) => {
    if (err) return res.json(err);
    else {
      return res.json(data);
    }
  });
});
app.post("/add-visitor", (req, res) => {
  const { fname, lname, phone, email, addr } = req.body;

  // ✅ Check if any field is missing
  if (!fname || !lname || !phone || !email || !addr) {
    return res.status(400).send("All fields are required");
  }

  const query = `
        INSERT INTO visitors (FirstName, LastName, Phone, Email,Address)
        VALUES (?, ?, ?, ?, ?)
    `;

  db.query(query, [fname, lname, phone, email, addr], (err, result) => {
    if (err) {
      console.error("Database Error: ", err);
      return res.status(500).send("Failed to add visitor");
    }

    const visitor_id = result.insertId;
    res.status(200).json({ visitor_id });
  });
});
app.post("/book-ticket", (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    address,
    ticketType,
    quantity,
    paymentMethod,
  } = req.body;

  // Insert visitor details
  const visitorQuery =
    "INSERT INTO Visitors (FirstName, LastName, Phone, Email, Address) VALUES (?, ?, ?, ?, ?)";
  db.query(
    visitorQuery,
    [firstName, lastName, phone, email, address],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error inserting visitor" });

      const visitorId = result.insertId;
      const today = new Date().toISOString().split("T")[0];
      const validity = new Date();
      validity.setDate(validity.getDate() + (ticketType === "Season" ? 30 : 1));
      const validityDate = validity.toISOString().split("T")[0];

      const ticketPrice =
        ticketType === "Single" ? 500 : ticketType === "Family" ? 1500 : 3000;
      const totalAmount = ticketPrice * quantity;

      // Insert ticket
      const ticketQuery =
        "INSERT INTO Tickets (VisitorId, TicketType, ReservationDate, ValidityDate, TicketPrice, Status ,Quantity) VALUES (?, ?, ?, ?, ?, 'Active',?)";
      db.query(
        ticketQuery,
        [visitorId, ticketType, today, validityDate, totalAmount, quantity],
        (err, ticketResult) => {
          if (err)
            return res.status(500).json({ message: "Error inserting ticket" });

          const ticketId = ticketResult.insertId;

          // Insert payment
          const paymentQuery =
            "INSERT INTO Payments (TicketId, Amount, PaymentDate, PaymentMethod) VALUES (?, ?, ?, ?)";
          db.query(
            paymentQuery,
            [ticketId, totalAmount, today, paymentMethod],
            (err) => {
              if (err)
                return res
                  .status(500)
                  .json({ message: "Error processing payment" });

              res.json({ message: "Ticket booked successfully!" });
            }
          );
        }
      );
    }
  );
});

app.listen(8081, () => {
  console.log("Server is running on port 8081");
});
