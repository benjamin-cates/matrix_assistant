import React from "react";
//Describes the ratio class that is used for all matrix cells and row coefficients
export class Ratio {
    numer: number;
    denom: number;
    constructor(top: number = 1, bot: number = 1) {
        //Reduce by gcd
        let gcd = Ratio.GCD(top, bot);
        this.numer = Math.floor(top / gcd);
        this.denom = Math.floor(bot / gcd);
    }
    copy = (): Ratio => {
        //Deep copy
        return new Ratio(this.numer, this.denom);
    }
    static equal(a: Ratio, b: Ratio) {
        let diff = a.numer / a.denom - b.numer / b.denom;
        //Test if they are within a close enough range
        if (diff > 0.000001 || diff < -0.000001) return false;
        return true;
    }
    static isValid(text: string): boolean {
        //Test if only has numbers
        if (!/^[0-9/ -]*$/.test(text)) return false;
        //Invalid if more than two divides
        if (text.split("/").length > 2) return false;
        return true;
    }
    static fromText(text: string, def: number = 0) {
        //Default
        if (text.length == 0) return new Ratio(def, 1);
        //Split into numerator and denominator
        let parts = text.split("/");
        if (parts.length > 2) throw "Invalid ratio";
        return new Ratio(Number(parts[0]), Number(parts[1] || "1"));
    }
    //Returns string form of ratio
    text = (): string => {
        if (this.denom == 1) return this.numer.toString();
        return this.numer.toString() + "/" + this.denom.toString();
    }
    //Add two ratios and reduce
    static Add(one: Ratio, two: Ratio) {
        // a/b + c/d = (a*d + c*b)/(b*d)
        let numer = one.numer * two.denom + two.numer * one.denom;
        let denom = one.denom * two.denom;
        return new Ratio(numer, denom);
    }
    //Multiply two ratios and reduce
    static Mul(one: Ratio, two: Ratio) {
        // a/b * c/d = (a*c)/(b*d)
        let numer = one.numer * two.numer;
        let denom = one.denom * two.denom;
        return new Ratio(numer, denom);
    }
    //Returns the greatest common divisor of a and b
    static GCD(a: number, b: number): number {
        if (!b) return a;
        return Ratio.GCD(b, a % b);
    }
}

export class RatioInput extends React.Component<{ type: string; name?: string }> {
    state: any
    constructor(props: { type: string; }) {
        super(props);
        this.state = { value: "" };
    }
    render() {
        let classN: string = "ratio_input";
        //Add invalid_ratio class name if invalid
        if (!Ratio.isValid(this.state.value)) classN += " invalid_ratio";
        classN += " " + this.props.type;
        let out = <input value={this.state.value}
            className={classN} id={this.props.name} onInput={this.handleChange} />;
        return out;
    }
    handleChange = (event: React.SyntheticEvent) => {
        //@ts-ignore
        this.setState({ value: event.currentTarget.value });
    }
    reset = () => {
        this.setState({ value: "" });
    }
    //Return current ratio (or null if nothing entered)
    getRatio = () => {
        if (this.state.value.length == 0) return null;
        if (!Ratio.isValid(this.state.value)) throw "Invalid number or fraction";
        return Ratio.fromText(this.state.value);
    }
}

export default {
    Ratio,
    RatioInput
}