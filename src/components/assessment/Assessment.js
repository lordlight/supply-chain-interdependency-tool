import React, { Component } from 'react';
import * as Survey from "survey-react";
import "survey-react/survey.css";

class Assessment extends Component {
  //Define Survey JSON
 //Here is the simplest Survey with one text question
  json = {
    pages: [
        {
            elements: [
                {
                    type: "radiogroup",
                    name: "eatsBreakfast",
                    title: "Do you eat breakfast?",
                    isRequired: true,
                    choices: [
                        'Yes',
                        'No'
                    ]
                },
                {
                    type: "checkbox",
                    name: "mainDish",
                    title: "Which of these would you choose?",
                    isRequired: true,
                    /*colCount: 2,*/
                    visibleIf: "{eatsBreakfast}='Yes'",
                    choices: [
                        {value: 1, text: "Waffle"},
                        {value: 2, text: "Pancake"},
                        {value: 3, text: "Omelet"},
                        {value: 4, text: "Crêpe"},
                        {value: 5, text: "Oatmeal"},
                        {value: 6, text: "Grits"},
                        {value: 7, text: "Toast"},
                        {value: 8, text: "Bagel"}
                    ]
                },
                {
                    type: "radiogroup",
                    name: "primaryTopping",
                    title: "Which of these toppings would you choose first?",
                    isRequired: false,
                    /*colCount: 2,*/
                    visibleIf: "{mainDish}<3 or {mainDish}=[1,2]",
                    choices: [
                        "Chocolate",
                        "Strawberry",
                        "Pistachio",
                        "Blueberry",
                        "Peanut butter",
                        "Maple Syrup",
                        "Whipped Cream"
                    ]
                }
            ]
        },
        {
            elements: [
                {
                    type: "radiogroup",
                    name: "hasDrink",
                    title: "Do you have a beverage in the morning?",
                    isRequired: true,
                    choices: [
                        'Yes',
                        'No'
                    ]
                },
                {
                    type: "radiogroup",
                    name: "hasCaffeine",
                    title: "Which drink would you choose first?",
                    isRequired: false,
                    /*colCount: 2,*/
                    visibleIf: "{hasDrink}='Yes'",
                    choices: [
                        {value: 1, text: "Coffee"},
                        {value: 2, text: "Espresso"},
                        {value: 3, text: "Latte"},
                        {value: 4, text: "Hot Tea"},
                        {value: 5, text: "Water"},
                        {value: 6, text: "Fruit Juice"}
                    ]
                },
                {
                    type: "radiogroup",
                    name: "addsCream",
                    title: "Do you add milk or cream?",
                    isRequired: false,
                    /*colCount: 2,*/
                    visibleIf: "{hasCaffeine}<5",
                    choices: [
                        "Yes",
                        "No"
                    ]
                }
            ]
        }
    ]
  };

  //Define a callback methods on survey complete
  onComplete(survey, options) {
    //Write survey results into database
    console.log("Survey results: " + JSON.stringify(survey.data));
  }

  render() {
    //Create the model and pass it into react Survey component
    //You may create survey model outside the render function and use it in your App or component
    //The most model properties are reactive, on their change the component will change UI when needed.
    var model = new Survey.Model(this.json);
    return (<Survey.Survey model={model} onComplete={this.onComplete}/>);
    /*
    //The alternative way. react Survey component will create survey model internally
    return (<Survey.Survey json={this.json} onComplete={this.onComplete}/>);
    */
    //You may pass model properties directly into component or set it into model
    // <Survey.Survey model={model} mode="display"/>
    //or 
    // model.mode="display"
    // <Survey.Survey model={model}/>
    // You may change model properties outside render function. 
    //If needed react Survey Component will change its behavior and change UI.
  }
}

export default Assessment;
