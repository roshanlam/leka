# Leka

https://leka.fly.dev/

Leka (Write in Nepali) is a note taking website written using node, expressjs, ejs and mongodb as the main tech stack.

The key features are basically being able to create notes where basic latex code can be written along with markdown code and being able to have all those notes saved in the users account.

To use the website simply signup and create an account and then create some notes. Simple as that :)

### DB configuration
create a db.js file and export your db like the following:
```
const dburl = "mongodb+srv://dbname:dbpassword@cluster0.sbyjh9w.mongodb.net/?retryWrites=true&w=majority";
module.exports = dburl;
```

Note: The Dockerfile and .toml have been created by fly.io when I deployed the website. 

## Running Locally

1. Make sure you are in the correct folder
2. Run `npm install`
3. Run `npm start`