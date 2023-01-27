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
    private performColumnSwap = (step: Step, out: Matrix) => {
        //Asserts
        if (Math.min(step.idx1, step.idx2) < 1 || Math.max(step.idx1, step.idx2) > this.width) throw "Column swap out of bounds";
        let one = step.idx1 - 1, two = step.idx2 - 1;
        //Swap names if they exist
        if (this.columnNames) {
            out.columnNames[one - 1] = this.columnNames[two - 1];
            out.columnNames[two - 1] = this.columnNames[one - 1];
        }
        //Swap columns row by row
        for (let y = 0; y < this.height; y++) {
            out.setCell(one, y, this.getCell(two, y));
            out.setCell(two, y, this.getCell(one, y));
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
        //Loop through list of steps and return a new matrix with those operations performed
        let out = this.copy();
        for (let step of steps) {
            if (step.type == "col") this.performColumnSwap(step, out);
            else if (step.type == "row") this.performRowSwap(step, out);
            else this.performRowAdd(step, out);
        }
        return out;
    }
};

interface MatrixDisplayProps {
    width: number, height: number, inputMode: boolean, mat?: Matrix,
};
//Displays a matrix (or an input matrix if inputMode==true)
export class MatrixDisplay extends React.Component<MatrixDisplayProps> {
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
    //Returns a list of cells
    renderColumn = (colId: number) => {
        let col = colId.toString();
        let cells: ReactElement[] = [];
        //Loop through rows
        for (let y = 0; y < this.props.height; y++) {
            //Input cell if is input mode
            if (this.props.inputMode)
                cells.push(<RatioInput type="cell" key={y.toString() + " " + col} ref={this.state.references[colId + this.props.width * y]}></RatioInput>);
            //Else display cell
            else cells.push(
                <div className="cell" key={y.toString() + " " + col}>{this.props.mat.getCell(colId, y).text()}</div>);
        }
        return cells;
    }
    render() {
        const columns = [];
        //Loop through columns
        for (let x = 0; x < this.props.width; x++) {
            columns.push(<div
                key={x.toString()}
                className="matrix_column">{this.renderColumn(x)}
            </div>);
        }
        //Make matrix
        return <div className="matrix_table">{columns}</div>
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