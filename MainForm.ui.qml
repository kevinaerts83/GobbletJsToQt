import QtQuick 2.5
import QtQuick.Window 2.2
import QtQuick.LocalStorage 2.0
import "gobblet.js" as Gobblet
import "StartScreen.js" as Begin

Rectangle {
    property alias mouseArea: mouseArea
    property variant humanPlayer : 0
    property variant level : 1
    property variant isView : false
    property variant myState
    property variant shadow: new Gobblet.Shadow()
    property variant previousPlayer : 0
    property variant stopAnimation : false
    property variant showWelcomeScreen: true
    property variant elements : []
    property variant scores : initScore()

    width: parent.width
    height: parent.height

    visible: true

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        onPressed: {
            if(enableMouse()) {
                if(showWelcomeScreen) {
                    var t = Begin.ClickEvent(mouseX, mouseY);
                    switch(t) {
                        case 1:
                         mycanvas.requestPaint();
                         break;
                        case 2:
                         myState = new Gobblet.State(width, height, level);
                         mycanvas.requestPaint();
                         break;
                        case 3:
                         deleteScore();
                         mycanvas.requestPaint();
                         break;
                        case 4:
                         mycanvas.requestPaint();
                         break;
                    }
                } else {
                    if(mouseX < 25 && mouseY < 25) {
                        showWelcomeScreen = true;
                        mycanvas.requestPaint();
                    } else {
                        Gobblet.onMouseDown(myState, mouseX, mouseY);
                    }
                }
            }
        }
        onPositionChanged: { if(!showWelcomeScreen && enableMouse()) { Gobblet.onMove(myState, mouseX, mouseY); } }
        onReleased: { if(!showWelcomeScreen && enableMouse()) { Gobblet.onUp(myState); } }

        onWheel: { if(!showWelcomeScreen) { myState.scale += myState.scale * wheel.angleDelta.y / 120 / 10; mycanvas.requestPaint();} }
    }

    function enableMouse() {
        return (isView || showWelcomeScreen) ? true : ((humanPlayer === 1) || (myState.currentPlayer === 0));
    }

    Timer {
        interval: 2
        running: true
        repeat: true
        onTriggered: setTimer()
    }

    function setTimer() {
        if(!showWelcomeScreen) {
            if(myState.selection === undefined) {
                if((humanPlayer === 0) && (myState.currentPlayer === 1)) {
                    myState.ai.move(myState.boardState, myState.pawns);
                    var cPawn = myState.ai.pawn;
                    Gobblet.onMouseDown(myState, Gobblet.centerPawn(cPawn.minX, cPawn.maxX), Gobblet.centerPawn(cPawn.minY, cPawn.maxY));
                }
            } else {
                if(myState.animationSelection > 0) {
                    if(Gobblet.animation(myState)) {
                        saveScore();
                    }
                }
                if(myState.valid === false) {
                    mycanvas.requestPaint();
                    myState.valid = true;
                }
            }
        }
    }

    function initScore() {
        var result = [3];
        result[0] = [0,0];
        result[1] = [0,0];
        result[2] = [0,0];

        var db = LocalStorage.openDatabaseSync("Gobblet", "1.0", "Persistance state", 50);
        db.transaction(function(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS Gobblet(level NUMBER, player0 NUMBER, player1 NUMBER)');
            var rs = tx.executeSql('SELECT * FROM Gobblet');
            for (var i = 0; i < rs.rows.length; i++) {
                result[rs.rows.item(i).level] = [rs.rows.item(i).player0, rs.rows.item(i).player1]
            }
        });

        return result;
    }

    function saveScore() {
        var db = LocalStorage.openDatabaseSync("Gobblet", "1.0", "Gobblet Scores", 50);
        db.transaction(function(tx) {
            var rs = tx.executeSql('SELECT * FROM Gobblet WHERE level=?', [level]);
            if(rs.rows.length > 0) {
                tx.executeSql("UPDATE Gobblet SET player0=?, player1=? WHERE level=?", [scores[level][0], scores[level][1], level]);
            } else {
                tx.executeSql("INSERT INTO Gobblet VALUES(?, ?, ?)", [level, scores[level][0], scores[level][1]]);
            }
        });
    }

    function deleteScore() {
        var db = LocalStorage.openDatabaseSync("Gobblet", "1.0", "Gobblet Scores", 50);
        db.transaction(function(tx) {
            tx.executeSql('DELETE FROM Gobblet');
        });
        scores[0] = [0,0];
        scores[1] = [0,0];
        scores[2] = [0,0];
    }

    Canvas {
        id: mycanvas
        width: parent.width
        height: parent.height

        onPaint: {
            var ctx = getContext("2d");
            ctx.clearRect(0, 0, width, height);

            if(showWelcomeScreen) {
                ctx.fillColor = Qt.rgba(0, 0, 0, 1);
                ctx.fillRect (0, 0, width, height);
                Begin.drawImages(ctx, width, height);
            }
            else
            {
                ctx.fillColor = Qt.rgba(0, 0, 0, 1);
                ctx.fillRect (0, 0, width, height);
                Gobblet.drawBackGround(ctx, myState);

                var i, b, scale, smallerPawns, l = myState.pawns.length;
                //draw sliders
                myState.sliders[0].draw(ctx);
                myState.sliders[1].draw(ctx);

                //draw board
                if(myState.recalculate) {
                        myState.a3DBoard.rotate(myState.rotMatrix);
                        myState.cube.rotate(myState.rotMatrix);

                        if(myState.scale !== 100) {
                                scale = myState.matrix.getScaling(myState.scale / 100.0);
                                myState.a3DBoard.zoom(scale, 0);
                                myState.cube.zoom(scale, 0);
                        }
                        smallerPawns = myState.matrix.getScaling(70 / 100.0);
                        myState.cube.zoom(smallerPawns, 1);
                        myState.cube.zoom(smallerPawns, 2);
                        myState.cube.zoom(smallerPawns, 3);

                        myState.board.translateAndProject();
                        //myState.scale
                }
                myState.board.draw(ctx);

                // calculate 2d points of pawns and determine the z-index
                for(i=0; i < l; i+=1) {
                    if(myState.recalculate || (myState.selection === myState.pawns[i])) {
                        myState.pawns[i].zoomAndRotate(myState.scale, myState.rotMatrix);
                    }
                }

                //draw shadow
                if(myState.selection && myState.selection.size !== undefined) {
                    shadow.draw(ctx, myState.selection, myState.scale, myState.rotMatrix);
                }

                //draw pawns
                myState.pawns.sort(function(a, b) {return (a.z_index - b.z_index);});
                for(i=0; i < l; i+=1) {
                    var isSelection = (myState.selection === myState.pawns[i]);
                    if(myState.recalculate || isSelection) {
                            myState.pawns[i].translateAndProject();
                    }
                    if(myState.invalidMoveCache && (isSelection === false)) {
                            isSelection = myState.pawns[i].enable;
                    }
                    myState.pawns[i].draw(ctx, isSelection);
                }

                myState.valid = true;
            }
        }
    }
}
