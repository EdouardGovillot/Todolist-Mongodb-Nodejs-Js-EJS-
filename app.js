const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
mongoose.connect(`mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.lbmup.mongodb.net/todolistDB`);

const itemsSchema = mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your Todolist"
});
const item2 = new Item({
    name: "Hit the + button to add something to the list."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const homeList = new List({
    name: "Home"
});

const workList = new List({
    name: "Work"
});

const defaultLists = [homeList, workList];

app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                try {
                    console.log("Base items successfully added.")
                } catch (err) {
                    console.log(err)
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
});

app.get("/:customListName", function(req, res) {
    const customListName = (req.params.customListName).charAt(0).toUpperCase() + (req.params.customListName).slice(1).toLowerCase();

    List.findOne({ name: customListName }, function(err, foundList) {
        if (err) {
            throw err;
        } else {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customListName)
            } else {
                //Show an existing list
                const foundListName = foundList.name;

                res.render('list', { listTitle: foundListName, newListItems: foundList.items })
            }
        }
    })
})

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove({ _id: checkedItemId }, function(err) {
            if (err) {
                throw err;
            } else {
                console.log("Successfully deleted the item!")
                res.redirect("/")
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (err) {
                throw err;
            } else {
                res.redirect("/" + listName);
            }
        })
    }
})

app.get("/about", function(req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log(`Server started on port ${port}`)
});

//  LOCAL TESTS //
// app.listen(3000, function() {
//     console.log("server started on port 3000")
// })