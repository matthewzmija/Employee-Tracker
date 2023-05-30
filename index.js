// Import required modules
const inquirer = require("inquirer");
const express = require("express");
const mysql = require("mysql2");
const cTable = require("console.table");

// Set up the server
const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Creating the connection to the database
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "workplace_db",
});

// Connection to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database. " + err.stack);
    return;
  }
  console.log("Connected to the database.");
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

// Define user selections which are the prompts made by the system
const userSelections = [
  "View All Departments",
  "View All Roles",
  "View All Employees",
  "Add a Department",
  "Add a Role",
  "Add an Employee",
  "Update an Employee Role",
  "None",
];

// Function to prompt system questions
const systemQuestions = () => {
  inquirer
    .prompt({
      type: "list",
      name: "systemQuestions",
      message: "What would you like to do?",
      choices: userSelections,
    })
    .then((answer) => {
      switch (answer.systemQuestions) {
        case userSelections[0]:
          // View All Departments portion when selected
          console.log("View All Departments");
          db.query(`SELECT * FROM department`, (err, result) => {
            if (err) {
              console.log(err);
            } else {
              console.table(result);
            }
            systemQuestions();
          });
          break;

        case userSelections[1]:
          // View All Roles portion when selected
          console.log("View All Roles");
          db.query(`SELECT * FROM role`, (err, result) => {
            if (err) {
              console.log(err);
            } else {
              console.table(result);
            }
            systemQuestions();
          });
          break;

        case userSelections[2]:
          // View All Employees portion when selected
          console.log("View All Employees");
          db.query(`SELECT * FROM employee`, (err, result) => {
            if (err) {
              console.log(err);
            } else {
              console.table(result);
            }
            systemQuestions();
          });
          break;

        case userSelections[3]:
          // Add a Department portion when selected
          console.log("Add a Department");
          inquirer
            .prompt({
              type: "input",
              message: "What is the department name?",
              name: "name",
            })
            .then((answer) => {
              console.log(answer);
              db.query(
                `INSERT INTO department (name) VALUES("${answer.name}")`,
                (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  db.query(`SELECT * FROM department`, (err, result) => {
                    if (err) {
                      console.log(err);
                    }
                    console.table(result);
                    systemQuestions();
                  });
                }
              );
            });
          break;

        case userSelections[4]:
          // Add a Role portion when selected
          console.log("Add a Role");
          db.query(`SELECT * FROM department`, (err, result) => {
            if (err) {
              console.log(err);
            }
            const departmentTitleArray = result.map((obj) => obj.name);
            inquirer
              .prompt([
                {
                  type: "input",
                  message: "What is the name of the role?",
                  name: "name",
                },
                {
                  type: "input",
                  message: "What is the salary of the role?",
                  name: "salary",
                },
                {
                  type: "list",
                  message: "What department does the role belong to?",
                  name: "department",
                  choices: departmentTitleArray,
                },
              ])
              .then((answer) => {
                const departmentID =
                  departmentTitleArray.findIndex(
                    (obj) => obj == answer.department
                  ) + 1;
                db.query(
                  `INSERT INTO role (title, department_id, salary) VALUES ("${answer.name}", ${departmentID}, ${answer.salary})`,
                  (err, result) => {
                    if (err) {
                      console.log(err);
                    }
                    console.log(`${answer.name} is now in the database`);
                    systemQuestions();
                  }
                );
              });
          });
          break;

        case userSelections[5]:
          // Add an Employee portion when selected
          console.log("Add an Employee");

          const obtainPosition = () => {
            return new Promise((resolve, reject) => {
              db.query("SELECT * FROM role", (err, result) => {
                if (err) {
                  console.log(err);
                  reject(err);
                } else {
                  const positioningMap = result.map((obj) => obj.title);
                  resolve(positioningMap);
                }
              });
            });
          };

          const obtainWorker = () => {
            return new Promise((resolve, reject) => {
              db.query("SELECT * FROM employee", (err, result) => {
                if (err) {
                  console.log(err);
                  reject(err);
                } else {
                  const workerIteration = result.map(
                    (employee) => `${employee.first_name} ${employee.last_name}`
                  );
                  resolve(workerIteration);
                }
              });
            });
          };

          // Obtain the specific roles and employees data
          Promise.all([obtainPosition(), obtainWorker()])
            .then(([roles, employees]) => {
              employees.push("None");
              inquirer
                .prompt([
                  {
                    type: "input",
                    name: "first",
                    message: "What is the employee's first name?",
                  },
                  {
                    type: "input",
                    name: "last",
                    message: "What is the employee's last name?",
                  },
                  {
                    type: "list",
                    name: "role",
                    message: "What is the employee's role?",
                    choices: roles,
                  },
                  {
                    type: "list",
                    name: "manager",
                    message: "Who is the employee's manager?",
                    choices: employees,
                  },
                ])
                .then((answer) => {
                  const roleID =
                    roles.findIndex((obj) => obj == answer.role) + 1;
                  let employeeID = null;
                  if (answer.manager !== "None") {
                    employeeID =
                      employees.findIndex((obj) => obj == answer.manager) + 1;
                  }
                  db.query(
                    `INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES ("${answer.first}", "${answer.last}", ${roleID}, ${employeeID})`,
                    (err, result) => {
                      if (err) {
                        console.log(err);
                      }
                      console.log(
                        `${answer.first} ${answer.last} has been added to the database`
                      );
                      systemQuestions();
                    }
                  );
                });
            })
            .catch((error) => {
              console.log(error);
            });
          break;

        case userSelections[6]:
          // Update an Employee Role portion when selected
          console.log("Update an Employee Role");

          db.query(
            `SELECT employee.id, employee.first_name, employee.last_name FROM employee`,
            (err, result) => {
              if (err) {
                console.log(err);
              }
              const workerIteration = result.map(
                (employee) => `${employee.first_name} ${employee.last_name}`
              );
              inquirer
                .prompt([
                  {
                    type: "list",
                    name: "employee",
                    message: "Select an employee to update:",
                    choices: workerIteration,
                  },
                ])
                .then((employeeAnswer) => {
                  const selectedEmployee =
                    workerIteration.findIndex(
                      (obj) => obj == employeeAnswer.employee
                    ) + 1;
                  db.query(`SELECT * FROM role`, (err, result) => {
                    if (err) {
                      console.log(err);
                    }
                    const positioningMap = result.map((obj) => obj.title);
                    inquirer
                      .prompt([
                        {
                          type: "list",
                          name: "role",
                          message: "Select a new role for the employee:",
                          choices: positioningMap,
                        },
                      ])
                      .then((roleAnswer) => {
                        const selectedRole =
                          positioningMap.findIndex(
                            (obj) => obj == roleAnswer.role
                          ) + 1;
                        db.query(
                          `UPDATE employee SET role_id = ${selectedRole} WHERE id = ${selectedEmployee}`,
                          (err, result) => {
                            if (err) {
                              console.log(err);
                            }
                            console.log(`The employee's role has been updated`);
                            systemQuestions();
                          }
                        );
                      });
                  });
                });
            }
          );
          break;

        case userSelections[7]:
          // None selection, closing the system
          console.log("Leaving system, bye");
          process.exit();
          break;
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

// Starting the application
systemQuestions();
