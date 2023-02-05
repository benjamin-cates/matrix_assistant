import { RefObject } from "preact";
import React, { ReactElement } from "react"
import { Ratio, RatioInput } from "./ratio"
import { Step, StepInput } from "./step"
/*
    Matrix stores a 2d array of ratio objects
 */
export class Matrix {
    values: Ratio[];
    width: number;
    height: number;
    columnNames: string[];
    constructor(w: number, h: number, v: Ratio[] = null, names: string[] = null) {
        this.width = w;
        this.height = h;
        this.values = v ? v : new Array(w * h).map(_ => new Ratio(1, 1));
        this.columnNames = names ? names : ["x", "y", "z", "w", "u", "v", "a", "b", "c", "d", "e", "f"];
    }
    //Returns a deep copy of the matrix
    copy = (): Matrix => {
        return new Matrix(this.width, this.height, this.values.map(r => r.copy()), this.columnNames.slice());
    }
    static random_integer_matrix(w: number, h: number): Matrix {
        let randInt = (max: number) => Math.floor(Math.random() * Math.random() * max * Math.sign(Math.random() - 0.5));
        //Generate random x vector to solve for
        let answers = new Array(h).fill(0).map(_ => randInt(20));
        //Generate random coefficients
        let coef = new Array(w * h).fill(0).map(_ => randInt(10));
        for (let i = 0; i < h; i++) {
            let sum = 0;
            for (let j = 0; j < w - 1; j++) {
                sum += coef[i * w + j] * answers[j];
            }
            //Set last element to be sum of the previous part
            coef[(w * i) + (w - 1)] = sum;
        }
        return new Matrix(w, h, coef.map(v => new Ratio(v, 1)));
    }
    //Returns the differences of two matrices
    static compare(a: Matrix, b: Matrix): number[] {
        if (a.size() != b.size()) throw "Cannot compare matrices of different sizes";
        let differences: number[] = [];
        //Loop through each element and add index to list if it is not equal
        for (let i = 0; i < a.size(); i++) {
            if (!Ratio.equal(a.values[i], b.values[i])) differences.push(i);
        }
        return differences;
    }
    size = () => {
        return this.width * this.height;
    }
    getCell = (x: number, y: number): Ratio => {
        return this.values[x + this.width * y];
    }
    setCell = (x: number, y: number, rat: Ratio) => {
        this.values[x + this.width * y] = rat;
    }
    private performColumnSwap = (step: Step) => {
        //Asserts
        if (Math.min(step.idx1, step.idx2) < 1 || Math.max(step.idx1, step.idx2) > this.width) throw "Column swap out of bounds";
        let one = step.idx1 - 1, two = step.idx2 - 1;
        //Swap names if they exist
        if (this.columnNames) {
            let oneName = this.columnNames[one], twoName = this.columnNames[two];
            this.columnNames[one] = twoName;
            this.columnNames[two] = oneName;
        }
        //Swap columns row by row
        for (let y = 0; y < this.height; y++) {
            let oneCell = this.getCell(one, y), twoCell = this.getCell(two, y);
            this.setCell(one, y, twoCell);
            this.setCell(two, y, oneCell);
        }
    };
    private performRowSwap = (step: Step, out: Matrix) => {
        //Asserts
        if (Math.min(step.idx1, step.idx2) < 1 || Math.max(step.idx1, step.idx2) > this.height) throw "Row swap out of bounds";
        let one = step.idx1 - 1, two = step.idx2 - 1;
        //Swap rows cell by cell
        for (let x = 0; x < this.width; x++) {
            out.setCell(x, one, this.getCell(x, two));
            out.setCell(x, two, this.getCell(x, one));
        }
    }
    private performRowAdd = (step: Step, out: Matrix) => {
        //Asserts
        if (step.idx1 < 1 || step.idx2 > this.height) throw "Row operation out of bounds";
        if (step.outidx < 1 || step.outidx > this.height) throw "Row operation out of bounds";
        let one = step.idx1 - 1, outidx = step.outidx - 1, two = step.idx2 - 1;
        //Perform row add (if there is a row 2)
        if (step.idx2) for (let i = 0; i < this.width; i++) {
            out.setCell(i, outidx, Ratio.Add(
                Ratio.Mul(step.num1, this.getCell(i, one)),
                Ratio.Mul(step.num2, this.getCell(i, two))));
        }
        //Else perform row multiplication
        else for (let i = 0; i < this.width; i++) {
            out.setCell(i, outidx, Ratio.Mul(step.num1, this.getCell(i, one)));
        }
    };
    performSteps = (steps: Step[]): Matrix => {
        let from: Matrix = this;
        //Perform column swaps first
        if (steps.some(s => s.type == "col")) {
            from = this.copy();
            steps.forEach(s => {
                if (s.type == "col")
                    from.performColumnSwap(s);
            });
            steps = steps.filter(s => s.type != "col");
        }
        //Loop through list of steps and return a new matrix with those operations performed
        let out = from.copy();
        for (let step of steps) {
            if (step.type == "row") from.performRowSwap(step, out);
            else from.performRowAdd(step, out);
        }
        return out;
    }
};

interface MatrixDisplayProps {
    width: number, height: number, inputMode: boolean, mat?: Matrix, continue?: () => void
};
//Displays a matrix (or an input matrix if inputMode==true)
export class MatrixDisplay extends React.PureComponent<MatrixDisplayProps> {
    state: {
        //List of references to input elements
        references: React.RefObject<RatioInput>[];
    };
    constructor(props: MatrixDisplayProps) {
        super(props);
        let matSize = props.width * props.height;
        let references = [] as RefObject<RatioInput>[];
        if (props.inputMode) references = new Array(matSize).fill(0).map(_ => React.createRef<RatioInput>());
        this.state = {
            references,
        };
    }
    //Tests if enter is pressed
    handleKey = (e: React.KeyboardEvent) => {
        if (e.key == "Enter" && this.props.inputMode) this.props.continue();

    }
    //Returns a list of cells
    renderRow = (rowId: number) => {
        let row = rowId.toString();
        let cells: ReactElement[] = [];
        //Loop through rows
        for (let x = 0; x < this.props.width; x++) {
            //Input cell if is input mode
            if (this.props.inputMode)
                cells.push(<RatioInput type="cell" key={x.toString() + " " + row} ref={this.state.references[x + rowId * this.props.width]}></RatioInput>);
            //Else display cell
            else cells.push(
                <div className="cell" key={x.toString() + " " + rowId}>{this.props.mat.getCell(x, rowId).text()}</div>);
        }
        return cells;
    }
    render() {
        const rows = [];
        //Loop through rows
        for (let y = 0; y < this.props.height; y++) {
            rows.push(<div
                key={y.toString()}
                className="matrix_row">{this.renderRow(y)}
            </div>);
        }
        //Render column names
        const colNames = this.props.mat?.columnNames.slice(0, this.props.width)
            .map((str, i) => <span key={i.toString()} className="column_name">{str}</span>);
        //Make matrix
        return <div className="matrix_table" onKeyDown={this.handleKey}><div className="column_name_list">{colNames}</div>{rows}</div>
    }
    componentDidUpdate(prevProps: MatrixDisplayProps) {
        //Update input references if resized
        if (this.props.inputMode && (this.props.width != prevProps.width || this.props.height != prevProps.height))
            this.setState({ references: new Array(this.props.width * this.props.height).fill(0).map(_ => React.createRef<RatioInput>()) });
    }
    getMatrix = () => {
        //Return matrix if it's in input mode
        let out = new Matrix(this.props.width, this.props.height);
        if (this.props.inputMode)
            out.values = this.state.references.map(v => Ratio.fromText(v.current.state.value, 0));
        return out;
    }
}
export default { Matrix, MatrixDisplay };