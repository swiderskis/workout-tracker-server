# Workout Tracker (server)

## About

The server side of a workout tracker, allowing users to create weekly workout plans 🏋️‍♂️

The client side repo of this web app can be found [here](https://github.com/swiderskis/workout-tracker-client).

## Setup

- Run the database.sql script on Postgres in order to create the required database
- Modify the postgres user credentials in database.ts to a user with the required permissions to allow the app to use the created database
- Create a .env file in the root of the server folder, add an environment variable named JWT_SECRET, and set it to any desired value
