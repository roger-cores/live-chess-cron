module.exports = function(models, ObjectId){

  var callback = function(err){
    if(err)
      console.log(err);
  }


  var keys = Object.keys(models);
  for(var key in keys){
    if(models.hasOwnProperty(keys[key])){
      console.log(keys[key])
      models[keys[key]].remove({}, callback);
    }
  }


  setTimeout(function(){

    console.log('seeding');

    var utensil1 = {
      _id: new ObjectId(),
      name: "skillet"
    };

    var utensil2 = {
      _id: new ObjectId(),
      name: "pan"
    };

    var unit1 = {
      _id: new ObjectId(),
      name: "litre"
    };

    var unit2 = {
      _id: new ObjectId(),
      name: "kg"
    };

    var ingredient1 = {
      _id: new ObjectId(),
      name: "tomato"
    };

    var ingredient2 = {
      _id: new ObjectId(),
      name: "potato"
    };

    var adjective1 = {
      _id: new ObjectId(),
      name: "smashed"
    };

    var adjective2 = {
      _id: new ObjectId(),
      name: "peeled"
    };

    var verb1 = {
      name: "saute",
      timeMandatory: true
    };

    var verb2 = {
      name: "add"
    };

    var category1 = {
      name: "Indian"
    };

    var category2 = {
      name: "Mexican"
    };


    var client = {
      name: "Frostox",
      clientId: "efOeHY5Ovf",
      clientSecret: "r18sAsEsxR",
      trustedClient: true
    }

    new models.Verb(verb1).save(callback);
    new models.Verb(verb2).save(callback);
    new models.Adjective(adjective1).save(callback);
    new models.Adjective(adjective2).save(callback);
    new models.Ingredient(ingredient1).save(callback);
    new models.Ingredient(ingredient2).save(callback);
    new models.Unit(unit1).save(callback);
    new models.Unit(unit2).save(callback);
    new models.Utensil(utensil1).save(callback);
    new models.Utensil(utensil2).save(callback);
    var newId = new models.ID();
    newId.email = "rogercores2@gmail.com";
    newId.nickname = "rogercores"
    newId.password = newId.generateHash("timex");

    newId.save(callback);
    new models.Category(category1).save(callback);
    new models.Category(category2).save(callback);

    new models.Client(client).save(callback);

  },3500);




}
