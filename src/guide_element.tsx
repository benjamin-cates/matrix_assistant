import React from "react";

const GuideElement = React.memo(({ closeCallback }: { closeCallback: () => void }) => {
    //Close menu when escape or enter are pressed
    const keydown = (e: React.KeyboardEvent) => {
        if (e.key == "Escape" || e.key == "Enter") closeCallback();
    }
    return <>
        <button id="guide_background" autoFocus onKeyDown={keydown} onClick={closeCallback}></button>
        <div id="guide" onKeyDown={keydown} tabIndex={0}>
            <button id="guide_close" onClick={closeCallback}>&times;</button>
            <h1>Guide</h1>
            <p>Matrix assistant is intended to help you learn how to solve matrices step-by-step with error correction.</p>

            <h2>Creating a matrix</h2>
            <p>In the top right of the menu, there are inputs for the width and height of a new matrix. Press create matrix after entering in the dimensions</p>

            <h2>Process</h2>
            <p>First enter the starting values of the matrix, then follow this process to solve it</p>
            <ol>
                <li>List the row operations you would like to perform</li>
                <li>Press the "continue" button</li>
                <li>Write in the resulting matrix</li>
                <li>When you hit "continue" the program will notify you of any errors made (depending on difficulty)</li>
                <li>Repeat</li>
            </ol>

            <h2>Difficulty</h2>
            <p>There are five difficulties: ignore errors, count errors, show errors, show corrections, and autofill. The difficulty determines how much help the program gives you. The difficulty is set in the top right of the screen.</p>
            <ol>
                <li>Ignore errors: Ignore errors entirely and let you continue</li>
                <li>Count errors: Tells you how many errors exist, but not where they are</li>
                <li>Show errors (default): Tells you where errors are</li>
                <li>Show corrections: Tells you where the errors are and what the correct value is</li>
                <li>Autofill: The matrix is filled automatically after row operations are listed</li>
            </ol>

            <h2>Row operations</h2>
            <p>Row operations are listed in the bottom right of the screen. The row operations are:</p>
            <ul>
                <li>Add row: Multiply a row by a scalar and add it to another row</li>
                <li>Swap rows</li>
                <li>Swap columns (also swaps column names)</li>
                <li>Set row: Set a row as a multiple of another</li>
            </ul>

            <h2>Keyboard shortcuts</h2>
            <p>Anywhere in the program, the tab key will jump you to the next logical input box.</p>
            <p>Within the row operation module, you can press the keys <b>a</b>, <b>s</b>, <b>r</b>, or <b>c</b> to jump to the corresponding column. Pressing enter within an operation input will also automatically add that row.</p>
            <p>Within the matrix input, you can press enter within any cell to click the continue button.</p>

            <h2>Other resources</h2>
            <ul>
                <li><a href="https://textbooks.math.gatech.edu/ila/row-reduction.html">Free textbook chapter on row reduction strategy</a></li>
                <li><a href="https://www.khanacademy.org/math/linear-algebra">Khan Academy Linear Algebra course</a></li>
                <li><a href="https://www.3blue1brown.com/topics/linear-algebra">3Blue1Brown Linear Algebra videos</a></li>
            </ul>
        </div></>;
});
export default GuideElement;