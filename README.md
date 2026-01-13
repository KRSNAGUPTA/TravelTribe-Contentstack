# TravelTribe

TravelTribe is a modern **hostel booking platform** that allows users to find, book, and review hostels across various destinations. Built using the MERN stack, TravelTribe integrates Razorpay & Google OAuth for seamless and secure user login.


## Features

* Browse and book hostels in different cities
* View availability and pricing for selected dates
* Secure booking via Razorpay
* User reviews and ratings for hostels
* Role-based access for users and admins
* Admin panel for managing hostels and bookings

## Tech Stack

| Technology   | Description          |
| ------------ | -------------------- |
| **Frontend** | React.js             |
| **Backend**  | Node.js, Express.js  |
| **Database** | MongoDB              |
| **Auth**     | Google OAuth, JWT    |
| **Styling**  | Tailwind CSS, ShadCN |
| **Payments** | Razorpay API         |

---

## Getting Started

### Prerequisites

* Node.js & npm
* MongoDB (local or cloud)
* Google Developer Account (for OAuth2 credentials)
* Razorpay Developer Account (for payment gateway integration)

### 1. Clone the Repo

```bash
git clone https://github.com/KRSNAGUPTA/TravelTribe.git
cd TravelTribe
```

### 2. Set Up Environment Variables

Create a `.env` file in both `client/` and `server/` directories:

#### In `/server/.env`:

* Copy Sample ENV from envSample file.
* Include values for MongoDB URI, JWT secret, Google OAuth keys, and Razorpay keys.

#### In `/client/.env`:

* Copy Sample ENV from envSample file.
* Include the base API URL and Google OAuth client ID.

### 3. Install Dependencies

#### Backend

```bash
cd server
npm install
npm run dev
```

#### Frontend

```bash
cd client
npm install
npm run dev
```

## Contact

Developed by [Krishna Gupta](https://github.com/KRSNAGUPTA). For questions or suggestions, feel free to raise an issue or reach out directly.
