function ChangePlayer() {
    level+=1;
    if(level === 3) {
        level = 0;
    }
};
function Start() {
    showWelcomeScreen = false;
};
function ClickEvent(x, y) {
    // Collision detection between clicked offset and element.
    var result = -1;
    elements.forEach(function(element) {
        if (y > element.top && y < (element.top + element.height) && x > element.left && x < (element.left + element.width)) {
            if(element.id === 'player2') {
                ChangePlayer();
                result = 1;
            } else if(element.id === 'start') {
                Start();
                result = 2;
            } else if(element.id === 'reset') {
                result = 3;
            } else if(element.id === 'view') {
                if(isView === false && (myState !== undefined)) {
                    showWelcomeScreen = false;
                    isView = true;
                    result = 4;
                }
            }
        }
    });
    return result;
};
function drawImages(ctx, width, height) {
    var font = '52pt Verdana', h1=80, h3 = 250;

    elements.pop();
    elements.pop();
    elements.pop();
    elements.pop();
    elements.pop();
    elements.push({id: 'player1', colour:'#225B77', width:100, height:140, top:200, left: width/6-40});
    elements.push({id: 'player2', colour:'#D2B48C', width: 100, height: 140, top: 200, left: width*5/6-40});
    elements.push({id: 'start', colour:'#606061', width: 60, height: 60, top: 200, left: width/2-40});
    elements.push({id: 'view', colour:'#606061', width: 60, height: 60, top: 280, left: width/2-40});
    elements.push({id: 'reset', colour:'#606061', width: 60, height: 60, top: 360, left: width/2-40});

    ctx.save();
    if(width < 540 || height < 540) {
        font = '32pt Verdana';
        h1 = 65;
        h3 = 180;

        if(elements[0].top === 200) {
            elements[0].top = 100;
            elements[0].left += 10;

            elements[1].top = 100;
            elements[1].left -= 10;

            elements[2].top = 100;
            elements[2].left += 20;

            elements[3].top = 160;
            elements[3].left += 20;

            elements[4].top = 220;
            elements[4].left += 20;
        }
    }
    if(level === undefined) {
        level = 0;
    }
    drawTextInCanvas(ctx , 'Gobblet', width/2, h1, 4, font);
    ctx.restore();

    // Render elements.
    ctx.save();
    elements.forEach(function(element) {
        if(element.id === 'player1') {
            drawFigure(ctx, element.colour, element.left, element.top);
            ctx.beginPath();
            ctx.font = font;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(scores[level][0], element.left + 38, element.top + h3);
            ctx.closePath();
        }
        else if(element.id === 'player2') {
            if(level === 2) {
                humanPlayer = 1;
                drawFigure(ctx, element.colour, element.left, element.top);
            } else {
                humanPlayer = 0;
                drawPC(ctx, element.colour, element.left, element.top);
            }
            ctx.beginPath();
            ctx.font = font;
            ctx.fillStyle = 'White';
            ctx.textAlign = 'center';
            ctx.fillText(scores[level][1], element.left + 38, element.top + h3);
            ctx.closePath();
        }
        else {
            drawButton(ctx, element.colour, element.left, element.top, element.id, width, height);
        }
    });
    ctx.restore();
};
function drawButton(ctx, color, w, h, id, ctxW, ctxH) {
    var i, round = 2*Math.PI, radius = 30,
    top = 10, bottom = 50, left = 20, right = 50,
    eyeLeft = [22,25,39,42], eyeTop = [20,22,20,22], eyeRadius = [6,2,6,2],
    offset = 0, oTop = 0;
    if(ctxW < 540 || ctxH < 540) {
        radius = 20;
        top = 7; bottom = 34; left = 15; right = 34;
        eyeLeft = [14,16,26,28]; eyeTop = [14,16,14,16]; eyeRadius = [4,1,4,1];
        offset = 11; oTop = 10;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(w+radius,h+radius,radius,0,round);

    ctx.lineWidth = 2;
    ctx.fillStyle = color;

    /*ctx.shadowColor = 'White';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;*/

    ctx.fill();
    ctx.strokeStyle = 'White';
    ctx.stroke();
    ctx.closePath();

    if(id==='start') {
        ctx.beginPath();
        ctx.fillStyle = 'White';
        ctx.moveTo(w+left,h+top);
        ctx.lineTo(w+right,h+(bottom - top)/2+top);
        ctx.lineTo(w+left,h+bottom);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'White';
        ctx.stroke();
        ctx.closePath();
    } else if(id==='view') {
        for(i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(w+eyeLeft[i],h+eyeTop[i],eyeRadius[i],0,round);
            ctx.fillStyle = i % 2 ? 'black' : 'white';
            ctx.fill();
            ctx.closePath();
        }
    } else if(id==='reset') {
        w -= offset;
        h -= oTop;
        ctx.beginPath();
        ctx.moveTo(w+18,h+25);
        ctx.lineTo(w+25,h+45);
        ctx.lineTo(w+38,h+45);
        ctx.lineTo(w+45,h+25);
        ctx.lineTo(w+18,h+25);
        ctx.fillStyle = 'White';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'Black';
        ctx.moveTo(w+24,h+27);
        ctx.lineTo(w+28,h+42);
        ctx.stroke();

        ctx.moveTo(w+31,h+27);
        ctx.lineTo(w+31,h+42);
        ctx.stroke();

        ctx.moveTo(w+39,h+27);
        ctx.lineTo(w+35,h+42);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'White';
        ctx.moveTo(w+20,h+15);
        ctx.lineTo(w+45,h+20);
        ctx.stroke();

        ctx.moveTo(w+31,h+15);
        ctx.lineTo(w+35,h+16);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.restore();
};
function drawTextInCanvas(ctx, texttowrite, wdth, hght, dpth, font) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = 'Yellow';
    ctx.textAlign = 'center';
    var cnt;
    for (cnt = 0; cnt < dpth; cnt+=1) {
        ctx.fillText(texttowrite, wdth - cnt, hght - cnt);
    }
    // shadow casting in bottom layers
    ctx.fillStyle = '#008080';
    /*ctx.shadowColor = 'White';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = dpth + 2;
    ctx.shadowOffsetY = dpth + 2;*/
    ctx.fillText(texttowrite, wdth - cnt, hght - cnt);
    ctx.restore();
};
function drawFigure(ctx, color, offsetX, offsetY) {
    var gradient1, gradient2, outlineColor = '#' + ((parseInt(color.substr(1), 16) & 0xfefefe) >> 1).toString(16);

    gradient1 = ctx.createRadialGradient(37.7+offsetX, 55.6+offsetY, 0.0, 37.7+offsetX, 55.6+offsetY, 46.1);
    gradient1.addColorStop(0.00, '#fff');
    gradient1.addColorStop(1.00, color);

    gradient2 = ctx.createRadialGradient(37.7+offsetX, 15.3+offsetY, 0.0, 37.6+offsetX, 15.3+offsetY, 31.1);
    gradient2.addColorStop(0.00, '#fff');
    gradient2.addColorStop(1.00, color);

    ctx.save();
    //draw body
    ctx.beginPath();
    ctx.moveTo(73.1+offsetX, 83.6+offsetY);
    ctx.bezierCurveTo(71.7+offsetX, 102.1+offsetY, 52.2+offsetX, 105.2+offsetY, 37.4+offsetX, 105.2+offsetY);
    ctx.bezierCurveTo(22.5+offsetX, 105.2+offsetY, 3.0+offsetX, 102.1+offsetY, 1.6+offsetX, 83.6+offsetY);
    ctx.bezierCurveTo(0.1+offsetX, 62.7+offsetY, 14.0+offsetX, 35.3+offsetY, 37.4+offsetX, 35.3+offsetY);
    ctx.bezierCurveTo(60.8+offsetX, 35.3+offsetY, 74.7+offsetX, 62.7+offsetY, 73.1+offsetX, 83.6+offsetY);
    ctx.closePath();
    ctx.fillStyle = gradient1;
    ctx.fill();
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4.0;
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
    //draw head
    ctx.beginPath();
    ctx.moveTo(61.2+offsetX, 25.3+offsetY);
    ctx.bezierCurveTo(61.2+offsetX, 38.4+offsetY, 50.5+offsetX, 49.1+offsetY, 37.4+offsetX, 49.1+offsetY);
    ctx.bezierCurveTo(24.2+offsetX, 49.1+offsetY, 13.6+offsetX, 38.4+offsetY, 13.6+offsetX, 25.3+offsetY);
    ctx.bezierCurveTo(13.6+offsetX, 12.1+offsetY, 24.2+offsetX, 1.5+offsetY, 37.4+offsetX, 1.5+offsetY);
    ctx.bezierCurveTo(50.5+offsetX, 1.5+offsetY, 61.2+offsetX, 12.1+offsetY, 61.2+offsetX, 25.3+offsetY);
    ctx.closePath();
    ctx.fillStyle = gradient2;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
    ctx.restore();
};
function drawPC(ctx, color, offsetX, offsetY) {
    ctx.save();

    ctx.lineWidth='1';
    ctx.strokeStyle='white';//'red'
    ctx.fillStyle='#FFEFDB';

    var rectWidth = 60;
    var rectHeight = 100;
    var rectX = offsetX + 15;
    var rectY = offsetY;
    var cornerRadius = 10;

    ctx.beginPath();
    //ctx.moveTo(rectX, rectY);
    ctx.moveTo(rectX + rectWidth - cornerRadius, rectY);
    ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);

    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
    ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);

    ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
    ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);

    ctx.lineTo(rectX, rectY + cornerRadius);
    ctx.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);

    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rectX + rectWidth/2, rectY + rectHeight - cornerRadius, 6, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#BBABA8';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = level ? 'red' : '#606061';
    ctx.fillRect(rectX + cornerRadius/2, rectY + cornerRadius/2, rectWidth - cornerRadius, rectHeight - cornerRadius - 12);

    ctx.restore();
};
