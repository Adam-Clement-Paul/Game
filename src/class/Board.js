import {Section} from "./Section.js";

export class Board {
    constructor (number_of_sections, number_of_fires) {
        this.number_of_sections = number_of_sections;
        this.number_of_fires = number_of_fires;
        this.sections = [];

        this.initSections();
    }

    initSections () {
        for (let i = 0; i < this.number_of_sections; i++) {
            this.sections.push(new Section(10, 10, this.number_of_fires, {x: 0, y: 0}));
        }
    }
}