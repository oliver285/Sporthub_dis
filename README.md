# SportHub

## 1. Application Description

Sporthub is an application that allows users to view sports-related stock data seamlessly. Users can also purchase sport-team related items on our store, allowing a common ground for fans of all teams!

Users will be able to create a unique account with username and password, and have access to profile editing. Once registered, you can add your favorite teams to your profile, allowing ease of viewing sports data on our sports data page.

## 2. Contributors

- Oliver Murray
- Alan Sevilla
- Carter Cabbage
- Lucas Chernoff

## 3. Technology Stack

- NodeJS
- PostreSQL
- Vanilla Javascript

## 4. Prerequisites to run the application

## 5. PayPal SDK Testing 
1. When prompted to make a payment, select the PayPal button.
2. Use the following Sandbox login to test the transactions:
 - Email: sb-owfbf12377204@personal.example.com
 - Password: 0v-hDU?5

## 6. Instructions to run locally

1. Create a .env file in the ProjectSourceCode directory with the following contents:

```
#node variables:
SESSION_SECRET="super duper secret!"
#database credentials:
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="sport_db"
POSTGRES_HOST="db"
POSTGRES_PORT="5432"
STOCK_API_KEY = "Vv4ccSgpX99Ia9ppOLxwmIyW_tG4Sjm3"
TEAM_TREND_API_KEY="4a43fbe39b644597859730d456c898a1"
BETTING_SPLIT_API_KEY = "4a43fbe39b644597859730d456c898a1"
```

2. Run docker-compose up to build and start the application

## 7. Instructions for running tests

1. After cloning the repository and configuring, navigate to the docker-compose.yaml file.
2. Insure the 'command' in the web container is set to: 'npm run testandrun' :
   ![Alt text](/src/resources/img/dockercompose.png)

## 8. Link to deployed application
