const express = require('express');
const app = express();

require('dotenv').config();

const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.use(session({
  secret: 'promptwala-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.query("SELECT * FROM users WHERE id=?", [id], (err, result) => {
    done(null, result[0]);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {

  const email = profile.emails[0].value;
  const name = profile.displayName;

  // 🔍 check user
  db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {

    if (result.length > 0) {
      return done(null, result[0]);
    }

    // 🆕 create user
    db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email],
      (err, newUser) => {
        return done(null, {
          id: newUser.insertId,
          name,
          email
        });
      }
    );
  });
}));




const path = require('path');

const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');

// temporary OTP store (simple version)
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: 'Promptwala <promptwala06@gmail.com>',
      to,
      subject,
      html
    });

    console.log("✅ Email Sent to:", to);
  } catch (err) {
    console.log("❌ Email Error:", err);
  }
}


function userTemplate(name) {
  return `
    <div style="margin:0; padding:0; background:#070b14; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:linear-gradient(145deg,#0f1726,#111827); border:1px solid #1f2a3d; border-radius:18px; padding:36px 30px; color:#ffffff; box-shadow:0 0 30px rgba(77,168,255,0.12);">
        
        <div style="text-align:center; margin-bottom:30px;">
          <img
            src="https://drive.google.com/uc?export=view&id=1yMISjQ0fdLVio6R-4pclE5lvTEQ2AEdp"
            alt="Promptwala Logo"
            style="width:120px; max-width:100%; display:inline-block; margin:0 auto 12px auto;"
          />
          <p style="font-size:12px; color:#4da8ff; margin:0 0 8px 0; letter-spacing:2px; text-transform:uppercase; font-weight:bold;">
            Promptwala
          </p>
          <p style="font-size:13px; color:#aab4c5; margin:0; letter-spacing:1px; line-height:1.6;">
            Inquiry Confirmation
          </p>
        </div>

        <p style="font-size:20px; margin:0 0 16px 0; color:#ffffff; font-weight:bold; text-align:center;">
          Inquiry Received Successfully
        </p>

        <div style="background:#0c1320; border:1px solid #1d293d; border-radius:14px; padding:20px 18px; margin-bottom:24px;">
          <p style="font-size:15px; color:#d6dbe6; line-height:1.8; margin:0 0 12px 0;">
            Hi <span style="color:#4da8ff; font-weight:bold;">${name}</span>,
          </p>
          <p style="font-size:15px; color:#d6dbe6; line-height:1.8; margin:0 0 12px 0;">
            Thank you for contacting <strong style="color:#ffffff;">Promptwala</strong>.
          </p>
          <p style="font-size:15px; color:#d6dbe6; line-height:1.8; margin:0;">
            We have received your inquiry and our team will contact you shortly with the next steps.
          </p>
        </div>

        <div style="text-align:center; margin:0 0 24px 0;">
          <a href="#" style="display:inline-block; background:linear-gradient(90deg,#4da8ff,#a855f7,#ff8a00); color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold; padding:14px 28px; border-radius:999px; box-shadow:0 0 18px rgba(168,85,247,0.22);">
            Visit Promptwala
          </a>
        </div>

        <hr style="border:none; border-top:1px solid #243044; margin:22px 0;">

        <p style="font-size:13px; color:#9aa6bb; line-height:1.8; margin:0 0 16px 0; text-align:center;">
          Regards,<br><span style="color:#ffffff; font-weight:bold;">Promptwala Team</span>
        </p>

        <p style="font-size:12px; color:#7f8ba0; text-align:center; line-height:1.8; margin:0;">
          This message was sent by <span style="color:#ffffff;">Promptwala</span><br>
          © 2026 Promptwala. All rights reserved.
        </p>
      </div>
    </div>
  `;
}




function adminTemplate(data) {
  return `
    <div style="margin:0; padding:0; background:#070b14; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:linear-gradient(145deg,#0f1726,#111827); border:1px solid #1f2a3d; border-radius:18px; padding:36px 30px; color:#ffffff; box-shadow:0 0 30px rgba(77,168,255,0.12);">
        
        <div style="text-align:center; margin-bottom:30px;">
          <img
            src="https://drive.google.com/uc?export=view&id=1yMISjQ0fdLVio6R-4pclE5lvTEQ2AEdp"
            alt="Promptwala Logo"
            style="width:120px; max-width:100%; display:inline-block; margin:0 auto 12px auto;"
          />
          <p style="font-size:12px; color:#4da8ff; margin:0 0 8px 0; letter-spacing:2px; text-transform:uppercase; font-weight:bold;">
            Promptwala
          </p>
          <p style="font-size:13px; color:#aab4c5; margin:0; letter-spacing:1px; line-height:1.6;">
            Admin Notification
          </p>
        </div>

        <p style="font-size:20px; margin:0 0 18px 0; color:#ffffff; font-weight:bold; text-align:center;">
          New Inquiry Received
        </p>

        <div style="background:#0c1320; border:1px solid #1d293d; border-radius:14px; padding:20px 18px; margin-bottom:24px;">
          <p style="margin:0 0 12px 0; font-size:14px; color:#d6dbe6; line-height:1.7;">
            <strong style="color:#ffffff;">Name:</strong> ${data.fullName}
          </p>
          <p style="margin:0 0 12px 0; font-size:14px; color:#d6dbe6; line-height:1.7;">
            <strong style="color:#ffffff;">Email:</strong> ${data.email}
          </p>
          <p style="margin:0 0 12px 0; font-size:14px; color:#d6dbe6; line-height:1.7;">
            <strong style="color:#ffffff;">Mobile:</strong> ${data.mobile}
          </p>
          <p style="margin:0 0 12px 0; font-size:14px; color:#d6dbe6; line-height:1.7;">
            <strong style="color:#ffffff;">Project:</strong> ${data.projectType}
          </p>
          <p style="margin:0; font-size:14px; color:#d6dbe6; line-height:1.8;">
            <strong style="color:#ffffff;">Details:</strong><br>
            ${data.projectDetails}
          </p>
        </div>

        <div style="text-align:center; margin:0 0 24px 0;">
          <a href="#" style="display:inline-block; background:linear-gradient(90deg,#4da8ff,#a855f7,#ff8a00); color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold; padding:14px 28px; border-radius:999px; box-shadow:0 0 18px rgba(168,85,247,0.22);">
            Open Admin Panel
          </a>
        </div>

        <hr style="border:none; border-top:1px solid #243044; margin:22px 0;">

        <p style="font-size:12px; color:#7f8ba0; text-align:center; line-height:1.8; margin:0;">
          This notification was generated by <span style="color:#ffffff;">Promptwala</span><br>
          © 2026 Promptwala. All rights reserved.
        </p>
      </div>
    </div>
  `;
}




// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 DB Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.log('❌ DB Error:', err);
  } else {
    console.log('✅ MySQL Connected');
  }
});

// Static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 🔹 Start Google login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 🔹 Callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/sign-in' }),
  (req, res) => {
    res.redirect('/google-success');
  }
);


app.get('/google-success', (req, res) => {
  if (!req.user) return res.redirect('/sign-in');

  res.send(`
    <script>
      localStorage.setItem("user", JSON.stringify({
        name: "${req.user.name}",
        email: "${req.user.email}"
      }));

      window.location.href = "/";
    </script>
  `);
});


// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Classes route
app.get('/classes', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'classes.html'));
});

// Projects route
app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'projects.html'));
});

// sign-in route
app.get('/sign-in', (req, res) => {
  res.sendFile(path.join(__dirname, 'views','auth', 'sign-in.html'));
});

// sign-up route
app.get('/sign-up', (req, res) => {
  res.sendFile(path.join(__dirname, 'views','auth', 'sign-up.html'));
});

// plan1 route
app.get('/plan1', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'plan1.html'));
});

// plan2 route
app.get('/plan2', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'plan2.html'));
});

// inquiry plan1 route
app.get('/inquiry-plan1', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'inquiry-plan1.html'));
});

// inquiry plan2 route
app.get('/inquiry-plan2', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'inquiry-plan2.html'));
});

// Bussiness Plan route
app.get('/bussiness-plan', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'bussiness-plan.html'));
});



// Client details  route
app.get('/client-details', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-details.html'));
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// ================= 🔥 SIGNUP =================
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        return res.json({ message: "User already exists or error" });
      }

      res.json({ message: "Signup successful" });
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= 🔥 LOGIN =================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.json({ message: "Server error" });

    if (result.length === 0) {
      return res.json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ message: "Wrong password" });
    }

    res.json({ message: "Login successful", user });
  });
});


// ================= INQUIRY =================
app.post('/inquiry', (req, res) => {
  const { name, mobile, email, message } = req.body;

  const sql = "INSERT INTO inquiries (name, mobile, email, message) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, mobile, email, message], (err, result) => {
    if (err) {
  console.log("❌ Inquiry Error:", err); // 👈 ye add karo
  return res.json({ message: "Error saving inquiry" });
}

    res.json({ message: "Inquiry sent successfully" });
  });
});

app.post('/plan-inquiry', async (req, res) => {
  const { projectType, fullName, mobile, email, projectDetails,couponCode,couponApplied,discountValue } = req.body;

  const sql = `
  INSERT INTO plan_inquiries 
  (project_type, full_name, mobile, email, project_details, coupon_code, coupon_applied, discount_value)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [projectType, fullName, mobile, email, projectDetails,couponCode || null,couponApplied || false,discountValue || 0], async (err, result) => {
    if (err) {
      console.log("❌ Error:", err);
      return res.json({ message: "Error saving inquiry" });
    }

    // 🔥 Send Emails
    await sendEmail(email, "Inquiry Received - Promptwala", userTemplate(fullName));

await sendEmail(
  "promptwala06@gmail.com",
  "New Inquiry Received",
  adminTemplate({ projectType, fullName, mobile, email, projectDetails })
);

    res.json({ message: "Inquiry submitted successfully" });
  });
});


app.post('/send-otp', (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

const mailOptions = {
  from: 'promptwala06@gmail.com',
  to: email,
  subject: 'OTP Verification',
  text: `Your OTP is ${otp}`,
  html: createOtpEmailTemplate(otp)
};

function createOtpEmailTemplate(otp) {
  return `
    <div style="margin:0; padding:0; background:#070b14; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:linear-gradient(145deg,#0f1726,#111827); border:1px solid #1f2a3d; border-radius:18px; padding:36px 30px; color:#ffffff; box-shadow:0 0 30px rgba(77,168,255,0.12);">
        
        <div style="text-align:center; margin-bottom:30px;">
          <img
            src="https://drive.google.com/uc?export=view&id=1yMISjQ0fdLVio6R-4pclE5lvTEQ2AEdp"
            alt="Promptwala Logo"
            style="width:120px; max-width:100%; display:inline-block; margin:0 auto 12px auto;"
          />
          <p style="font-size:12px; color:#4da8ff; margin:0 0 8px 0; letter-spacing:2px; text-transform:uppercase; font-weight:bold;">
            Promptwala
          </p>
          <p style="font-size:13px; color:#aab4c5; margin:0; letter-spacing:1px; line-height:1.6;">
            OTP Verification
          </p>
        </div>

        <p style="font-size:18px; margin:0 0 16px 0; color:#ffffff; font-weight:bold; text-align:center;">
          Your verification code is ready
        </p>

        <div style="background:#0c1320; border:1px solid #1d293d; border-radius:14px; padding:20px 18px; margin-bottom:24px; text-align:center;">
          <p style="line-height:1.8; font-size:14px; color:#d6dbe6; margin:0 0 12px 0;">
            Use the OTP below to continue your verification process.
          </p>
          <div style="display:inline-block; padding:12px 24px; border-radius:12px; background:linear-gradient(90deg,#4da8ff,#a855f7,#ff8a00); color:#ffffff; font-size:28px; font-weight:bold; letter-spacing:6px;">
            ${otp}
          </div>
        </div>

        <p style="font-size:13px; color:#9aa6bb; line-height:1.8; margin:0 0 20px 0; text-align:center;">
          This OTP is valid for a limited time. Do not share it with anyone.
        </p>

        <hr style="border:none; border-top:1px solid #243044; margin:22px 0;">

        <p style="font-size:12px; color:#7f8ba0; text-align:center; line-height:1.8; margin:0;">
          This message was sent by <span style="color:#ffffff;">Promptwala</span><br>
          © 2026 Promptwala. All rights reserved.
        </p>
      </div>
    </div>
  `;
}




  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.log(err);
      return res.json({ message: "Error sending OTP" });
    }

    res.json({ message: "OTP sent successfully" });
  });
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.json({ message: "No OTP found" });
  }

  if (Date.now() > record.expires) {
    return res.json({ message: "OTP expired" });
  }

  if (record.otp != otp) {
    return res.json({ message: "Invalid OTP" });
  }

  delete otpStore[email];

  res.json({ message: "OTP verified" });
});


transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ SMTP Error:", error);
  } else {
    console.log("✅ SMTP Server Ready");
  }
});




app.get('/admin/inquiries', (req, res) => {
  const sql = "SELECT * FROM plan_inquiries ORDER BY created_at DESC";

  db.query(sql, (err, result) => {
    if (err) return res.json({ message: "Error" });
    res.json(result);
  });
});

app.get('/admin/inquiry/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM plan_inquiries WHERE id = ?",
    [id],
    (err, result) => {
      if (err || result.length === 0) {
        return res.json({ message: "Not found" });
      }

      res.json(result[0]);
    }
  );
});

app.post('/admin/update-status', (req, res) => {
  const { id, status } = req.body;

  const sql = "UPDATE plan_inquiries SET status=? WHERE id=?";

  db.query(sql, [status, id], (err) => {
    if (err) return res.json({ message: "Error updating" });
    res.json({ message: "Status updated" });
  });
});

app.post('/admin/delete', (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM plan_inquiries WHERE id=?";

  db.query(sql, [id], (err) => {
    if (err) return res.json({ message: "Error deleting" });
    res.json({ message: "Deleted" });
  });
});

// USERS
app.get('/admin/users', (req, res) => {
  db.query("SELECT * FROM users ORDER BY id DESC", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

// CONTACT INQUIRIES
app.get('/admin/contact', (req, res) => {
  db.query("SELECT * FROM inquiries ORDER BY id DESC", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

app.post('/admin/update-note', (req, res) => {
  const { id, note } = req.body;

  const sql = "UPDATE plan_inquiries SET admin_note=? WHERE id=?";

  db.query(sql, [note, id], (err) => {
    if (err) return res.json({ message: "Error saving note" });

    res.json({ message: "Note saved" });
  });
});


app.post('/admin/send-email', (req, res) => {
  const { id, message } = req.body;

  // 🔹 Step 1: get email from DB
  
  const sql = "SELECT email, full_name FROM plan_inquiries WHERE id=?";

  db.query(sql, [id], async (err, result) => {
    if (err || result.length === 0) {
      return res.json({ message: "User not found" });
    }

    const userEmail = result[0].email;
    const userName = result[0].full_name;

    // 🔹 Step 2: send email
    try {
      await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Update for your project - ${userName}`,
      html: createEmailTemplate(userName, message)
    });

      res.json({ message: "Email sent successfully" });

    } catch (error) {
      console.log(error);
      res.json({ message: "Email sending failed" });
    }
  });
});


function createEmailTemplate(name, message) {
  return `
  <div style="margin:0; padding:0; background:#070b14; font-family:Arial, Helvetica, sans-serif;">
    
    <div style="max-width:600px; margin:40px auto; background:linear-gradient(145deg,#0f1726,#111827); border:1px solid #1f2a3d; border-radius:18px; padding:36px 30px; color:#ffffff; box-shadow:0 0 30px rgba(77,168,255,0.12);">
      
      <!-- LOGO -->
      <div style="text-align:center; margin-bottom:30px;">
        
        <div style="margin-bottom:14px;">
          <img 
            src="https://drive.google.com/uc?export=view&id=1yMISjQ0fdLVio6R-4pclE5lvTEQ2AEdp"
            alt="Promptwala Logo"
            style="
              width:120px;
              max-width:100%;
              display:inline-block;
              margin:0 auto 12px auto;
            "
          />
        </div>

        <p style="
          font-size:12px;
          color:#4da8ff;
          margin:0 0 8px 0;
          letter-spacing:2px;
          text-transform:uppercase;
          font-weight:bold;
        ">
          Promptwala
        </p>

        <p style="
          font-size:13px;
          color:#aab4c5;
          margin:0;
          letter-spacing:1px;
          line-height:1.6;
        ">
          Smart Project Solutions
        </p>

      </div>

      <!-- MESSAGE -->
      <p style="font-size:18px; margin:0 0 16px 0; color:#ffffff; font-weight:bold;">
        Hi <span style="color:#4da8ff;">${name}</span>,
      </p>

      <div style="
        background:#0c1320;
        border:1px solid #1d293d;
        border-radius:14px;
        padding:20px 18px;
        margin-bottom:24px;
      ">
        <p style="
          line-height:1.8;
          font-size:15px;
          color:#d6dbe6;
          margin:0;
        ">
          ${message}
        </p>
      </div>

      <div style="text-align:center; margin:0 0 24px 0;">
        <a href="#" style="
          display:inline-block;
          background:linear-gradient(90deg,#4da8ff,#a855f7,#ff8a00);
          color:#ffffff;
          text-decoration:none;
          font-size:14px;
          font-weight:bold;
          padding:14px 28px;
          border-radius:999px;
          box-shadow:0 0 18px rgba(168,85,247,0.22);
        ">
          Visit Promptwala
        </a>
      </div>

      <hr style="border:none; border-top:1px solid #243044; margin:22px 0;">

      <!-- FOOTER -->
      <p style="
        font-size:12px;
        color:#7f8ba0;
        text-align:center;
        line-height:1.8;
        margin:0;
      ">
        This message was sent by <span style="color:#ffffff;">Promptwala</span><br>
        © 2026 Promptwala. All rights reserved.
      </p>

    </div>
  </div>
  `;
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }

  res.redirect('/sign-in');
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/sign-in');
}

app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/verify-coupon', (req, res) => {
  const { code } = req.body;

  const sql = "SELECT * FROM coupons WHERE code=? AND is_active=1";

  db.query(sql, [code], (err, result) => {
    if (err) return res.json({ success: false });

    if (result.length === 0) {
      return res.json({ success: false, message: "Invalid Coupon" });
    }

    const coupon = result[0];

    res.json({
      success: true,
      discount: coupon.discount,
      type: coupon.type
    });
  });
});

app.post('/track-visit', (req, res) => {
  const sql = "UPDATE analytics SET visitors = visitors + 1 WHERE id = 1";

  db.query(sql, (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

app.get('/admin/stats', (req, res) => {

  const usersQuery = "SELECT COUNT(*) AS totalUsers FROM users";
  const inquiryQuery = "SELECT COUNT(*) AS totalInquiries FROM plan_inquiries";
  const couponQuery = "SELECT COUNT(*) AS totalCoupons FROM plan_inquiries WHERE coupon_applied = 1";
  const visitorQuery = "SELECT visitors FROM analytics WHERE id = 1";

  db.query(usersQuery, (err, users) => {
    db.query(inquiryQuery, (err, inquiries) => {
      db.query(couponQuery, (err, coupons) => {
        db.query(visitorQuery, (err, visitors) => {

          res.json({
            users: users[0].totalUsers,
            inquiries: inquiries[0].totalInquiries,
            coupons: coupons[0].totalCoupons,
            visitors: visitors[0].visitors
          });

        });
      });
    });
  });
});


app.post("/save-email", (req, res) => {

  const { email } = req.body;

  if (!email) {
    return res.send("Email required");
  }

  const sql = "INSERT INTO notify_users (email) VALUES (?)";

  db.query(sql, [email], (err, result) => {

    if (err) {
      console.log(err);
      return res.send("Database Error");
    }

    res.send("Email Saved 🚀");
  });
});

// const password = "p0o9i8u7y6t5r4e3w2q1+-*/";
// bcrypt.hash(password, 10).then(hash => {
//   console.log(hash);
// });

// 🔹 SERVER
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});