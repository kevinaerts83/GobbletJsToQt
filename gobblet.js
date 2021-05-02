var publisher = {
    on: function(type, fn, context) {
        type = type || 'any';
        fn = (typeof fn === 'function') ? fn : context[fn];
        if(this.subscribers[type] === undefined) {
            this.subscribers[type] = [];
        }
        this.subscribers[type].push({fn: fn, context: context || this});
    },
    remove: function(type, fn, context) {
        this.visitSubscribers('unsubscribe', type, fn, context);
    },
    fire: function(type, publication) {
        this.visitSubscribers('publish', type, publication);
    },
    visitSubscribers: function(action, type, arg, context) {
        var i, pubtype = type || 'any', subscribers = this.subscribers[pubtype], max = subscribers ? subscribers.length : 0;
        for(i=0; i < max; i+=1) {
            if(action === 'publish') {
                subscribers[i].fn.call(subscribers[i].context, arg);
            } else {
                if(subscribers[i].fn === arg && subscribers[i].context === context) {
                    subscribers.splice(i, 1);
                }
            }
        }
    }
};

function makePublisher(o) {
    for(var i in publisher) {
        if(publisher.hasOwnProperty(i) && (typeof publisher[i] === 'function')) {
            o[i] = publisher[i];
        }
    }
    o.subscribers = {any: []};
};

/**
 * Matrix helper class
 * @class Matrix
 * @constructor
 * @namespace GOBBLET
 * @param {decimal} canvasWidth
 * @param {decimal} canvasHeight
 */
function Matrix(canvasWidth, canvasHeight) {
    var centerX = canvasWidth/2, centerY = canvasHeight/2, centerZ = 0;//-centerX;
    /**
     * translation matrix moves the point to the 0,0,0 position, to enable rotation calculations on this point
     * @property translation
     * @type array
     */
    this.translation = [[1.0, 0, 0, -centerX],[0, 1.0, 0, -centerY],[0, 0, 1.0, -centerZ],[0, 0, 0, 1.0]];
    /**
     * inverse translation matrix moves the point back to it's original position
     * @property inverseTranslation
     * @type array
     */
    this.inverseTranslation = [[1.0, 0, 0, centerX],[0, 1.0, 0, centerY],[0, 0, 1.0, centerZ],[0, 0, 0, 1.0]];
    /**
     * projection matrix, moves the point to it's z=0 position but adjusting the x and y so a 3d effect occurs
     * @property projection
     * @type array
     */
    //this.projection =[[1.0, 0, 1/2 * Math.cos(Math.PI/4), 0], [0, 1.0, 1/2 * Math.sin(Math.PI/4), 0], [0, 0, 0, 0], [0, 0, 0, 1.0]];
};

/**
 * Multiply a point with a matrix
 * @method multiplyPointAndMatix
 * @namespace GOBBLET
 * @param {array} point A point represented by an array [x,y,z,1]
 * @param {array} matrix A 4x4 matrix
 */
Matrix.prototype.multiplyPointAndMatrix = function(point, matrix) {
    var i, j, tmp, newPoint = [0,0,0,1];
    for(i=0; i < 4; i+=1) {
        tmp = 0;
        for(j=0; j < 4; j+=1) {
            tmp += point[j]*matrix[i][j];
        }
        newPoint[i] = tmp;
    }
    return newPoint;
};

Matrix.prototype.projectPoint = function(point) {
    var p = this.multiplyPointAndMatrix(point, this.translation);

    var x = p[0],
    y = p[1],
    z = p[2],
    f = -1/2000,
    s = 1;

    p = [x/((z*f) + s), y/((z*f) + s), 0, 1];

    return this.multiplyPointAndMatrix(p, this.inverseTranslation);
};

/**
 * Multiply a matrix with a matrix
 * @method multiplyMatrixAndMatrix
 * @namespace GOBBLET
 * @param {array} matrix1 a matrix 4x4
 * @param {array} matrix2 a matrix 4x4
 */
Matrix.prototype.multiplyMatrixAndMatrix = function(matrix1, matrix2) {
    var i, j, newMatrix = [[],[],[],[]];
    for(i=0; i < 4; i+=1) {
        for(j=0; j < 4; j+=1) {
            newMatrix[i][j] = (matrix1[i][0] * matrix2[0][j]) +
                              (matrix1[i][1] * matrix2[1][j]) +
                              (matrix1[i][2] * matrix2[2][j]) +
                              (matrix1[i][3] * matrix2[3][j]);
        }
    }
    return newMatrix;
};

/**
 * Translation
 * @method getTranslation
 * @namespace GOBBLET
 * @param {float} x
 * @param {float} y
 * @param {float} z
 */
Matrix.prototype.getTranslation = function(x, y, z) {
    return  [[1.0, 0, 0, x],[0, 1.0, 0, y],[0, 0, 1.0, z],[0, 0, 0, 1.0]];
};

/**
 * Scaling
 * @method getScaling
 * @namespace GOBBLET
 * @param {float} zoom
 */
Matrix.prototype.getScaling = function(scale) {
    return  [[scale, 0, 0, 0],[0, scale, 0, 0],[0, 0, scale, 0],[0, 0, 0, 1.0]];
};

/**
 * Rotation matrix
 * @method getRotationMatrix
 * @namespace GOBBLET
 * @param {float} rotation
 */
Matrix.prototype.getRotationMatrix = function(x, y) {
    var angleX = Math.PI * x / 180,
        angleY = Math.PI * y / 180,
        cosx = Math.cos(angleX),
        sinx = -(Math.sin(angleX)),
        cosy = Math.cos(angleY),
        siny = -(Math.sin(angleY)),
        xFacesMatrix = [[1.0, 0, 0, 0], [0, cosx, -sinx, 0], [0, sinx, cosx, 0], [0, 0, 0, 1.0]],
        yFacesMatrix = [[cosy, 0, -siny, 0], [0, 1.0, 0, 0], [siny, 0, cosy, 0], [0, 0, 0, 1.0]];

    return this.multiplyMatrixAndMatrix(xFacesMatrix, yFacesMatrix);
};

/**
 * Slider class
 * @class Slider
 * @constructor
 * @namespace GOBBLET
 */
function Slider(canvasX, canvasY, horizontal) {
    var w, margin = 4;
    this.horizontal = horizontal;
    this.normalWindow = canvasX > canvasY;
    if(horizontal) {
        this.offsetX = 30;
        this.offsetY = 5;
        this.sliderHeight = 25;
        w = canvasX/10;

        this.x = (canvasX-w)/2;
        this.y = canvasY - (this.sliderHeight - margin);
        this.w = w;
        this.h = this.sliderHeight - margin*2 - this.offsetY;
        this.totalWidth = (this.x - this.offsetX) * 2;
    } else {
        this.offsetX = 5;
        this.offsetY = 30;
        this.sliderHeight = canvasY/10;
        w = 25;

        this.x = canvasX - (w - this.offsetX);
        this.y = (canvasY - this.sliderHeight)/2;
        this.w = w - margin*2 - this.offsetX;
        this.h = this.sliderHeight;
        this.totalHeight = (this.y - this.offsetY) * 2;
    }
    this.angle = 0;
    this.setAngle();
};

/**
* Setter
* @method set
*/
Slider.prototype.translate = function(newX, newY) {
    if(this.offsetX) {
        if(newX >= this.offsetX && newX <= (this.totalWidth + this.offsetX)) {
            this.x = newX;
        }
    }
    if(this.offsetY) {
        if(newY >= this.offsetY && newY <= (this.totalHeight + this.offsetY)) {
            this.y = newY;
        }
    }
    this.setAngle();
};

/**
 * Draw the shape
 * @method draw
 */
Slider.prototype.draw = function(ctx) {
    ctx.save();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    if(this.horizontal) {
        ctx.lineTo(this.x + this.w, this.y);
        ctx.arc(this.x + this.w, this.y + this.h / 2, this.h / 2, 1.5 * Math.PI, 0.5 * Math.PI, false);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.arc(this.x, this.y + this.h / 2, this.h / 2, 0.5 * Math.PI, 1.5 * Math.PI, false);
    } else {
        ctx.lineTo(this.x, this.y + this.h);
        ctx.arc(this.x + this.w / 2, this.y + this.h, this.w / 2, Math.PI, 0, true);
        ctx.lineTo(this.x + this.w, this.y);
        ctx.arc(this.x + this.w / 2, this.y, this.w / 2, 0, Math.PI, true);
    }
    //ctx.fillRect (this.x,this.y,this.w, this.h);
    ctx.stroke();
    ctx.closePath();
    //ctx.fillStyle = fillColor;
    //ctx.fill();
    ctx.restore();
};

/**
 * Calculate angle
 * @method draw
 */
Slider.prototype.getAngle = function() {
    return this.angle;
};
Slider.prototype.setAngle = function() {
    var a;
    if(this.horizontal) {
        a = (this.normalWindow) ? 360 : 180;
        this.angle = ((this.x-this.offsetX) * a)/this.totalWidth;
    } else {
        a = ((this.y-this.offsetY)*360)/this.totalHeight;
        //reduce angle
        this.angle = (a*55/180);
    }
};
/**
 * Determine if a point is inside the shape's bounds
 * @method contains
 */
Slider.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Height) and its Y and (Y + Height)
  return (this.x <= mx) && (this.x + this.w >= mx) && (this.y <= my) && (this.y + this.h >= my);
};

/**
 * Shape3D class
 * @class Shape3D
 * @constructor
 * @namespace GOBBLET
 */
function Shape3D() {
    this.points = [];
    //cached points are rotated and scaled
    this.cache = [];
    this.aHashMap = { 0:1, 1:2, 2:4, 3:8, 5:16, 6:32, 7:64, 8:128, 10:256, 11:512, 12:1024, 13:2048, 15:4096, 16:8192, 17:16384, 18:32768};
};

/**
 * Rotate all the points of the shape
 * @method rotate
 * @namespace GOBBLET
 * @param {array} rotationMatrix to rotate points
 */
Shape3D.prototype.rotate = function(rotationMatrix) {
    var i, l, rotatedPoints = [];
    for (i = 0, l = this.points.length; i < l; i+=1) {
        rotatedPoints[i] = this.matrix.multiplyPointAndMatrix(this.points[i], rotationMatrix);
    }
    this.cache[0] = rotatedPoints;
};

/**
 * Make smaller cubes
 * @method zoom
 * @namespace GOBBLET
 * @param {array} scalingMatrix to zoom points
 */
Shape3D.prototype.zoom = function(scalingMatrix, size) {
    var i, l, scaledPoints = [];
    for (i = 0, l = this.points.length; i < l; i+=1) {
        scaledPoints[i] = this.matrix.multiplyPointAndMatrix(this.cache[(size ? size - 1: 0)][i], scalingMatrix);
    }
    this.cache[size] = scaledPoints;
};

/**
 * Cube class
 * @class Cube
 * @namespace GOBBLET
 * @param {int} s tileSize size of one board tile
 * @param {array} matrix Our matrix object with defined center
 */
function Board3D(s, matrix) {
    this.matrix = matrix;
    this.tileSize = s;
    this.tileCenters = [];
    /*this.w = s*4;
    this.h = 10;*/

    /**
     * define points of the board
     * @property points
     * @type array
    */
    this.points[0] = [-2*s,0,-2*s,1];
    this.points[1] = [-s,0,-2*s,1];
    this.points[2] = [0,0,-2*s,1];
    this.points[3] = [s,0,-2*s,1];
    this.points[4] = [2*s,0,-2*s,1];

    this.points[5] = [-2*s,0,-s,1];
    this.points[6] = [-s,0,-s,1];
    this.points[7] = [0,0,-s,1];
    this.points[8] = [s,0,-s,1];
    this.points[9] = [2*s,0,-s,1];

    this.points[10] = [-2*s,0,0,1];
    this.points[11] = [-s,0,0,1];
    this.points[12] = [0,0,0,1];
    this.points[13] = [s,0,0,1];
    this.points[14] = [2*s,0,0,1];

    this.points[15] = [-2*s,0,s,1];
    this.points[16] = [-s,0,s,1];
    this.points[17] = [0,0,s,1];
    this.points[18] = [s,0,s,1];
    this.points[19] = [2*s,0,s,1];

    this.points[20] = [-2*s,0,2*s,1];
    this.points[21] = [-s,0,2*s,1];
    this.points[22] = [0,0,2*s,1];
    this.points[23] = [s,0,2*s,1];
    this.points[24] = [2*s,0,2*s,1];

    this.points[25] = [-2*s,10,-2*s,1];
    this.points[26] = [2*s,10,-2*s,1];
    this.points[27] = [-2*s,10,2*s,1];
    this.points[28] = [2*s,10,2*s,1];

    /**
     * define 12 faces of the cube
     * @property faces
     * @type array
     */
    this.faces = [];

    //back
    this.faces[0] = [4, 26, 25, 0];
    this.faces[1] = [25, 0, 4, 0];
    //right
    this.faces[2] = [28, 26, 4, 0];
    this.faces[3] = [4, 24, 28, 0];
    //left
    this.faces[4] = [0, 25, 27, 0];
    this.faces[5] = [27, 20, 0, 0];
    //front
    this.faces[6] = [24, 20, 27, 0];
    this.faces[7] = [27, 28, 24, 0];
    //down
    /*this.faces[36] = [28, 24, 23];
    this.faces[37] = [23, 27, 28];*/

    //up
    this.faces[8] = [20, 24, 4, 1];
    this.faces[9] = [4, 0, 20, 1];

    this.faces[10] = [5 ,6, 1, 1];
    this.faces[11] = [1, 0, 5, 1];
    this.faces[12] = [7, 8, 3, 1];
    this.faces[13] = [3, 2, 7, 1];

    this.faces[14] = [11, 12, 7, 1];
    this.faces[15] = [7, 6, 11, 1];
    this.faces[16] = [13, 14, 9, 1];
    this.faces[17] = [9, 8, 13, 1];

    this.faces[18] = [15, 16, 11, 1];
    this.faces[19] = [11, 10, 15, 1];
    this.faces[20] = [17, 18, 13, 1];
    this.faces[21] = [13, 12, 17, 1];

    this.faces[22] = [21, 22, 17, 1];
    this.faces[23] = [17, 16, 21, 1];
    this.faces[24] = [23, 24, 19, 1];
    this.faces[25] = [19, 18, 23, 1];

    /**
     * store tileCenters to position pawns
     * @property tileCenters
     * @type array
     */
    this.tileCenters[0] = [-1.5*s,0,-1.5*s,1];
    this.tileCenters[1] = [-0.5*s,0,-1.5*s,1];
    this.tileCenters[2] = [0.5*s,0,-1.5*s,1];
    this.tileCenters[3] = [1.5*s,0,-1.5*s,1];

    this.tileCenters[5] = [-1.5*s,0,-0.5*s,1];
    this.tileCenters[6] = [-0.5*s,0,-0.5*s,1];
    this.tileCenters[7] = [0.5*s,0,-0.5*s,1];
    this.tileCenters[8] = [1.5*s,0,-0.5*s,1];

    this.tileCenters[10] = [-1.5*s,0,0.5*s,1];
    this.tileCenters[11] = [-0.5*s,0,0.5*s,1];
    this.tileCenters[12] = [0.5*s,0,0.5*s,1];
    this.tileCenters[13] = [1.5*s,0,0.5*s,1];

    this.tileCenters[15] = [-1.5*s,0,1.5*s,1];
    this.tileCenters[16] = [-0.5*s,0,1.5*s,1];
    this.tileCenters[17] = [0.5*s,0,1.5*s,1];
    this.tileCenters[18] = [1.5*s,0,1.5*s,1];

    /**
     * define a colour for every face
     * @property facesColour
     * @type array
     */
    var i = 0;
    this.facesColour = new Array(41);
    for(i = 0; i < 8; i+=1) {
        this.facesColour[i] = 'white';//'black';
    }
    this.facesColour[8] ='#00aaaa';//'tan';
    this.facesColour[9] ='#00aaaa';//'tan';
    for(i = 10; i < 26; i+=1) {
        this.facesColour[i] = '#004848';//'saddlebrown';
    }
};

/**
 * inherit from Shape3D class
 * @method prototype
 */
Board3D.prototype = new Shape3D();

/**
* Pawn wants to move to a new position on the board
* check if this is a valid position
* @method isValidPosition
* @return the index of the chosen board box
*/
Board3D.prototype.isValidPosition = function(x, y) {
    var p, padding, padding2, xBoard, dBoard,
        i = 0,
        j = 0;
    /*
    #0##1##2##3 ##4
    ########### ###
    #5##6##7##8 ##9
    ########### ###
    10#11#12#13 #14
    ########### ###
    15#16#17#18 #19

    ########### ###
    20#21#22#23 #24
    */
    if(x > this.points[4][0]) {
        return -1;
    }

    if( x > this.points[3][0]) {
        i = 3;
    }
    else if( x > this.points[2][0]) {
        i = 2;
    }
    else if( x > this.points[1][0]) {
        i = 1;
    }
    else if( x > this.points[0][0]) {
        i = 0;
    }
    else {
        return -1;
    }

    if(y > this.points[20][2]) {
        return -1;
    }

    if(y > this.points[15][2]) {
        j = 15;
    }
    else if(y > this.points[10][2]) {
        j = 10;
    }
    else if(y > this.points[5][2]) {
        j = 5;
    }
    else if(y > this.points[0][2]) {
        j = 0;
    }
    else {
        return -1;
    }
    p = i + j;
    padding = this.tileSize / 4;
    padding2 = this.tileSize - padding;
    xBoard = this.points[p][0];
    dBoard = this.points[p][2];

    if(x < (xBoard + padding) || y < (dBoard + padding)) {
        return -1;
    }
    if(x > (xBoard + padding2) || y > (dBoard + padding2)) {
        return -1;
    }
    return p;
};

/**
 * Cube class
 * @class Cube
 * @param {int} tileSize size of one board plane
 * @param {array} matrix Our matrix object with defined center
 */
function Cube(tileSize, matrix) {
    var face0_b1, face1_b2, face4_r1, face5_r2, face6_u1, face7_u2, face8_l1, face9_l2, face10_f1, face11_f2;
    var w = (((tileSize - 5) / 2) >> 0), h = (((tileSize * 1.3) / 2) >> 0), d = w;

    this.w = w;
    this.h = h;
    this.d = d;

    /**
     * define 8 points of the cube
     * @property points
     * @type array
     *
     *       	4#######5
     *       	##      -#
     *       	# #     - #
     *       	#  7#######6
     *       	#  #    -  #
     *       	#  #    -  #
     *       	#  #    -  #
     *       	0--#----1  #
     *       	 # #     - #
     *       	  ##      -#
     *       	   3#######2
    */
    this.points[0] = [w,h,d,1];
    this.points[1] = [-w,h,d,1];
    this.points[2] = [-w,h,-d,1];
    this.points[3] = [w,h,-d,1];
    this.points[4] = [w/2,-h,d/2,1];
    this.points[5] = [-w/2,-h,d/2,1];
    this.points[6] = [-w/2,-h,-d/2,1];
    this.points[7] = [w/2,-h,-d/2,1];

    /**
     * matrix constructed with the center of the cube
     * @property matrix
     * @type object
     */
    this.matrix = matrix;

    /*
     * Combine all points with triangles faces so a cube will be formed.
     * If the dot product of the 2 vectors of this triangular is smaller than zero
     * (points away from the center) the face is visible.
     * To make this work:
     * - Move around the shape and look at triangular when it is visible.
     * - Now add the points to the array of the shape counterclockwise.
     * - To calculate the dot vector take point 0 of the triangular and draw a vector to point 1
     *   this vector will point counterclockwise. The second vector is from point 0 to point 2 and will point clockwise.
     * EXAMPLE:
     * the front face: points 2 - 7 - 3 (counterclockwise). vector1= 2-7; vector2 = 2-3
     * the back face: points 1 - 0 - 4 (counterclockwise) look at it from the back. vector1= 1-0; vector2 = 1-4
     * Now the right hand rule says (vector1 = index finger, vector2 = middle finger; dot product = thumb)
     * With the front face the thumb points away from the center, and with the back face the thumb points to the center.
     */
    //back
    face0_b1 = [1, 0, 4, 0];
    face1_b2 = [4, 5, 1, 0];
    //down
    //  var face2_d1 = [2, 3, 0];
    //  var face3_d2 = [0, 1, 2];
    //right
    face4_r1 = [2, 1, 5, 0];
    face5_r2 = [5, 6, 2, 0];
    //up
    face6_u1 = [7, 6, 5, 0];
    face7_u2 = [5, 4, 7, 0];
    //left
    face8_l1 = [0, 3, 7, 0];
    face9_l2 = [7, 4, 0, 0];
    //front
    face10_f1 = [3, 2, 6, 1];
    face11_f2 = [6, 7, 3, 1];

    this.faces = [face0_b1, face1_b2, face4_r1, face5_r2, face6_u1, face7_u2, face8_l1, face9_l2, face10_f1, face11_f2];//, face2_d1, face3_d2
};

/**
 * inherit from Shape3D class
 * @method prototype
 */
Cube.prototype = new Shape3D();

/**
 * Shape class
 * @class Shape
 * @constructor
 * @namespace GOBBLET
 */
function Shape() {
    this.percent = 0;
};

/**
* Translate 3d shape to it's 2d position and shape
* @method translate
*/
Shape.prototype.translateAndProject = function() {
    this.points_2d = [];
    var i, l, translation,
        isPawn = false,
        c = 0;
    if(this.size !== undefined) {
        isPawn = true;
        c = this.size;
    }
    if(!isPawn || this.visible === true) {
        translation = this.matrix.getTranslation(this.centerPoint2D[0], this.centerPoint2D[1], this.centerPoint2D[2]);
        for (i = 0, l = this.shape3D.cache[c].length; i < l; i+=1) {
            this.points_2d[i] = this.matrix.projectPoint(this.matrix.multiplyPointAndMatrix(this.shape3D.cache[c][i], translation));
            if(isPawn) {
                this.setBoundaries(this.points_2d[i], i===0);
            }
        }
    }
};

/**
 * Darker color
 * @method darkerColor
 * @namespace GOBBLET
 */
Shape.prototype.darkerColor = function(color, prc) {
    if(prc !== 0) {
        var num = parseInt(color.slice(1),16),
            amt = Math.round(2.55 * prc),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }
    return color;
};

/**
 * Draw shape
 * @method draw
 * @namespace GOBBLET
 * @param {2d context} ctx The context
 */
Shape.prototype.draw = function(ctx, isSelection) {
    ctx.save();
    if(ctx && this.points_2d.length > 0 && (this.visible === undefined || this.visible === true)) {
        var i, l, face, colourLength = this.facesColour.length-1;
        ctx.lineWidth = 1;
        if(isSelection) {
            ctx.strokeStyle = this.darkerColor(this.facesColour[0], this.percent*2);
        } else {
            ctx.strokeStyle = (this.facesColour.length > 1) ? '#000' : this.darkerColor(this.facesColour[0], this.percent);
        }
        ctx.lineWidth= (this.facesColour.length > 1) ? 1 : 2;
        for (i = 0, l = this.shape3D.faces.length; i < l; i+=1) {
            face = this.shape3D.faces[i];

            face[3] = this.dotProduct(face, this.points_2d) ? 1 : 0;
            if(face[3] === 1) {
                ctx.fillStyle = this.facesColour[i > colourLength ? colourLength : i];
                ctx.beginPath();
                ctx.moveTo(this.points_2d[face[0]][0],this.points_2d[face[0]][1]);
                ctx.lineTo(this.points_2d[face[1]][0],this.points_2d[face[1]][1]);
                ctx.lineTo(this.points_2d[face[2]][0],this.points_2d[face[2]][1]);
                ctx.stroke();

                //SELECTION
                /*ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;*/

                ctx.fill();
            }
        }

        /*REMOVE
        ctx.rect(this.minX, this.minY, this.maxX-this.minX, this.maxY-this.minY);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'italic bold 10px sans-serif';
        for(var i = 0, l = this.points_2d.length; i < l; i++) {
            ctx.fillText(i, this.points_2d[i][0], this.points_2d[i][1]);
        }
        //END*/
    }
    ctx.restore();
};

/**
 * Calculate the dot product of the face
 * dot product => determine how similar two vectors point to the same point (same direction = 1;  90 degrees = 0; opposite direction = -1)
 * or simply put the cosine between two vectors
 * @method dotProduct
 * @namespace GOBBLET
 * @param {array} points The 2d points of the shape
 * @param {array} face An array with indexes of the points of the face
 */
Shape.prototype.dotProduct = function(face, p) {
    var a1 = p[face[1]][0] - p[face[0]][0],
        a2 = p[face[1]][1] - p[face[0]][1],
        b1 = p[face[2]][0] - p[face[0]][0],
        b2 = p[face[2]][1] - p[face[0]][1];

    return (a1*b2 - a2*b1) < 0;
};

/**
 * Determine the boundaries of a shape
 * @method contains
 */
Shape.prototype.setBoundaries = function(point2d, first) {
    if(first) {
        this.minX = point2d[0];
        this.minY = point2d[1];
        this.maxX = point2d[0];
        this.maxY = point2d[1];
    }
    else {
        if(point2d[0] < this.minX) {
            this.minX = point2d[0];
        }
        if(point2d[0] > this.maxX) {
            this.maxX = point2d[0];
        }
        if(point2d[1] < this.minY) {
            this.minY = point2d[1];
        }
        if(point2d[1] > this.maxY) {
            this.maxY = point2d[1];
        }
    }
};

/**
 * Determine if a point is inside the shape's bounds
 * @method contains
 */
Shape.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Height) and its Y and (Y + Height)
  if((this.minX <= mx) && (this.maxX >= mx) && (this.minY <= my) && (this.maxY >= my)) {
      this.mouseX = mx;
      this.mouseY = my;
      return true;
  }

  this.mouseX = -1;
  this.mouseY = -1;
  return false;
};

/**
 * Pawn class
 * @class Pawn
 * @constructor
 * @namespace GOBBLET
 * @param {matrix} matrix Our matrix object with defined center
 * @param {float} x x-axis value
 * @param {float} y y-axis value
 * @param {float} z z-axis value
 * @param {float} d depth of the pawn
 * @param {int} size 0 = biggest pawn, 1 = normal pawn, ...
 */
function Pawn(matrix, x, y, z, h, d, size, isTurn, n) {
    this.matrix = matrix;
    this.depth = d;
    this.pHeight = Math.floor(h * Math.pow(0.7, size));
    this.size = size;
    this.visible = (size % 4 === 0);
    this.setInvisible = false;
    this.onTheBoard = false;
    this.endX = x;
    this.endZ = z;
    this.enable = true;
    this.isTurn = isTurn;
    this.tile = -1;

    y -= this.pHeight;
    this.centerPoint = [x, y, z, 1];
    this.centerPoint2D = [x, y, z, 1];

    this.mouseX = 0;
    this.mouseY = 0;
    this.z_index = z + d / 2;
    this.id = n;
};

/**
 * inherit from Shape class
 * @method prototype
 */
Pawn.prototype = new Shape();

/**
 * scale and rotate the center point of the shape
 * @method zoomAndRotate
 * @namespace GOBBLET
 */
Pawn.prototype.zoomAndRotate = function(scale, rotMatrix) {
    if(this.visible) {
        var p = [this.centerPoint[0], this.centerPoint[1], this.centerPoint[2], 1];
        if(rotMatrix) {
            p = this.matrix.multiplyPointAndMatrix(p, this.matrix.translation);
            p = this.matrix.multiplyPointAndMatrix(p, this.matrix.getScaling(scale /100.0));
            p = this.matrix.multiplyPointAndMatrix(p, rotMatrix);
            p = this.matrix.multiplyPointAndMatrix(p, this.matrix.inverseTranslation);
        }
        this.z_index = p[2] + (this.depth / 2);
        this.centerPoint2D = p;
    }
};

/**
* Move selected pawn according to the mouse movement
* @method translate
*/
Pawn.prototype.move = function(newX, newY, angle) {
     var sine = Math.round(Math.sin(Math.PI * angle/180)),
     cosine = Math.round(Math.cos(Math.PI * angle/180)),
     tx = (newX - this.mouseX),
     ty = (newY - this.mouseY),
     x = tx*cosine - ty*sine,
     y = tx*sine + ty*cosine;

    this.centerPoint[0] += x;
    this.centerPoint[2] += y;

    this.mouseX = newX;
    this.mouseY = newY;
};

/**
* Lift the pawn on mouse up, drop on mouse down
* @method lift
*/
Pawn.prototype.lift = function(up) {
    this.centerPoint[1] += up;
};
/**
* Place the pawn onto the board
* @method endMove
*/
Pawn.prototype.endMove = function(h) {
    this.centerPoint[1] = h - this.pHeight;
};

/**
* Validate after another pawn has moved
* onDown mouse => isDown = false; isDownValid = true; isOnBoard = true;
* onUp mouse (Invalid move) => isDown = true; isDownValid = false; isOnBoard = check if selected pawn came from stack or board;
* movePawn (valid move) => isDown = true; isDownValid = true; isOnBoard = true;
* @method notification
*/
Pawn.prototype.notification = function(args) {
    var i,
        isDown = args[0],
        isDownValid = args[1],
        bState = args[2],
        isOnBoard = args[3],
        found = false;
    if(this.tile > -1) {
        var t = this.shape3D.aHashMap[this.tile];
        for(i=0; i < this.size; i++) {
            if((bState[i] & t) === t) {
                found = true;
                this.setInvisible = true;
                break;
            }
        }
        if(!found) {
            this.visible = true;
        }
    }
    if(isDown) {
        if(isDownValid) {
            this.isTurn ^= 1;
        }
        if(isOnBoard) {
            this.enable = isDownValid;
        }
    }
};
/**
* Finish event settings
* @method endEvent
*/
Pawn.prototype.endEvent = function(args) {
    if(this.setInvisible) {
        this.visible = false;
        this.setInvisible = false;
    }
};

/**
 * Board class
 * @class Board
 * @namespace GOBBLET
 * @param {array} matrix Our matrix object with defined center
 */
function Board(matrix, x, y, z) {
    this.matrix = matrix;
    this.centerPoint = [x, y, z, 1];
    this.centerPoint2D = [x, y, z, 1];
};

/**
 * inherit from Shape class
 * @method prototype
 */
Board.prototype = new Shape();

/**
 * Shadow class
 * 2D figure
 * @class Shadow
 * @constructor
 * @namespace GOBBLET
 */
function Shadow() {
};

/**
 * Draw shadow
 * @method draw
 * @namespace GOBBLET
 * @param {2d context} ctx The context
 */
Shadow.prototype.draw = function(ctx, pawn, scale, rotMatrix) {
    //unlift centerpoint
    var newY = pawn.matrix.inverseTranslation[1][3] - pawn.pHeight-5,
     cp_3D = [pawn.centerPoint[0], newY, pawn.centerPoint[2], 1], //3d center point
     cp_2D = this.zoomAndRotate(scale, rotMatrix, pawn.matrix, cp_3D), //2d center point
     points_2d = this.translateAndProject(pawn, cp_2D); //translate and project

    //draw
    if(ctx) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(points_2d[0][0], points_2d[0][1]);
        ctx.lineTo(points_2d[1][0], points_2d[1][1]);
        ctx.lineTo(points_2d[2][0], points_2d[2][1]);
        ctx.lineTo(points_2d[3][0], points_2d[3][1]);
        ctx.closePath();
        ctx.fillStyle = 'rgba(70,70,70,0.6)';
        ctx.fill();
        ctx.restore();
    }
};

Shadow.prototype.zoomAndRotate = function(scale, rotMatrix, matrix, cp) {
    var p = [cp[0], cp[1], cp[2] , 1];
    if(rotMatrix) {
        p = matrix.multiplyPointAndMatrix(p, matrix.translation);
        p = matrix.multiplyPointAndMatrix(p, matrix.getScaling(scale /100.0));
        p = matrix.multiplyPointAndMatrix(p, rotMatrix);
        p = matrix.multiplyPointAndMatrix(p, matrix.inverseTranslation);
    }
    return p;
};

Shadow.prototype.translateAndProject = function(pawn, cp) {
    var i, l, points_2d = [],
        translation = pawn.matrix.getTranslation(cp[0], cp[1], cp[2]);
    for (i = 0, l = pawn.shape3D.cache[pawn.size].length; i < l; i+=1) {
        points_2d[i] = pawn.matrix.projectPoint(pawn.matrix.multiplyPointAndMatrix(pawn.shape3D.cache[pawn.size][i], translation));
    }
    return points_2d;
};

/**
 * AI class
 * @class AI
 * @constructor
 * @namespace GOBBLET
 */
function AI() {
    this.nextMove = -1;
    this.pawn = {};
    this.level = 0;
    this.tiles = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18];
    this.mask = [61440, 3840, 240, 15, 34952, 17476, 8738, 4369, 33825, 4680];
    /*1111 0000 0000 0000
      0000 1111 0000 0000
      0000 0000 1111 0000
      0000 0000 0000 1111
      1000 1000 1000 1000
      0100 0100 0100 0100
      0010 0010 0010 0010
      0001 0001 0001 0001
      1000 0100 0010 0001
      0001 0010 0100 1000*/
    this.visibleWhite = 0;
    this.visibleBlack = 0;
    this.visibleWhiteRows = [];
    this.visibleBlackRows = [];
    this.moving = false;
    this.rowsWith3BlackPawns = [];
    this.report = -1; //test framework
    this.crossings = 38505; //parseInt('1001011001101001', 2); tiles that occur in 3 masks
    this.randomMaskSequence = this.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); //don't loop in sequence else the moves are predictable
};

/**
* Calculate visible pawns
* @method cache
*/
AI.prototype.cache = function (isWhite, bState) {
    var t, foo = bState[isWhite], bar = bState[2], temp = [];

    temp[0] = foo[0];
    temp[1] = (foo[1] ^ bar[0]) & foo[1];
    temp[2] = (foo[2] ^ (bar[0] | bar[1])) & foo[2];
    temp[3] = (foo[3] ^ (bar[0] | bar[1] | bar[2])) & foo[3];
    t = temp[0] | temp[1] | temp[2] | temp[3];

    if (isWhite) {
        this.visibleWhite = t;
        this.visibleWhiteRows[0] = temp[0];
        this.visibleWhiteRows[1] = temp[1];
        this.visibleWhiteRows[2] = temp[2];
        this.visibleWhiteRows[3] = temp[3];
    } else {
        this.visibleBlack = t;
        this.visibleBlackRows[0] = temp[0];
        this.visibleBlackRows[1] = temp[1];
        this.visibleBlackRows[2] = temp[2];
        this.visibleBlackRows[3] = temp[3];
    }
};

/**
* Property RowsWith3BlackPawns
* @method getRowsWith3BlackPawns
*/
AI.prototype.getRowsWith3BlackPawns = function () {
    if (this.rowsWith3BlackPawns === undefined) {
        this.rowsWith3BlackPawns = this.rowCheck(false, 3, [], false);
    }
    return this.rowsWith3BlackPawns;
};

/**
* Calculate next move
* @method move
*/
AI.prototype.move = function (bState, pawns) {
    if (this.moving === false) {
        this.moving = true;// make threat save

        delete this.rowsWith3BlackPawns;
        this.cache(0, bState);
        this.cache(1, bState);

        this.report = 0;
        if (this.tryToWin(bState, pawns)) {
            this.report = 1;
            if (this.dontLose(bState, pawns)) {
                this.report = 2;
                if (this.block(bState, pawns)) {
                    this.report = 3;
                    this.attack(bState, pawns);
                }
            }
        }
        //fallback
        if ((this.pawn === undefined) || (this.pawn.tile === undefined) || (this.tiles.indexOf(this.nextMove) === -1)) {
            this.randomMove(pawns);
            console.log('current tile: ' + this.pawn.tile + ', next tile: ' + this.nextMove);
        }
        //console.log('current tile: ' + this.pawn.tile + ', next tile: ' + this.nextMove);
        this.moving = false;
    }
};

/**
* Try To Win
* @method tryToWin
*/
AI.prototype.tryToWin = function (bState, pawns) {
    var i, l, blackSize, maskToCheck, rows = this.rowCheck(true, 3, bState, true); //Get all white rows with 3 on a row without black size 0

    for (i = 0, l = rows.length; i < l; i += 1) {
        maskToCheck = this.mask[rows[i]];
        //the tile to attack
        this.nextMove = this.getNextMove(maskToCheck, this.visibleWhite, true);
        //check if the tile is empty
        if ((this.visibleBlack & maskToCheck) !== 0) {
            blackSize = this.getPawnSize(this.nextMove, pawns);
            if (blackSize > 0 && blackSize < 4) {
                return this.setNextPawn(pawns, blackSize, rows, bState);
            }
        } else {
            return this.setNextPawn(pawns, 4, rows, bState);
        }
    }
    return true;
};

/**
* Don't lose
* @method dontLose
*/
AI.prototype.dontLose = function (bState, pawns) {
    var i, l, s, maskCrossing, maskToCheck,
        rows = this.rowCheck(false, 3, bState, true); //Get all black rows with 3 on a row without white size 0

    if (rows.length > 1) {
        maskCrossing = this.mask[rows[0]];
        for (i = 1, l = rows.length; i < l; i += 1) {
            maskCrossing &= this.mask[rows[i]];
        }
        if (maskCrossing > 0) {
            //check if the opponent has a size 0 on the row
            //if ((bState[1][0] & maskCrossing) === 0) {
            this.nextMove = this.getNextMove(0, maskCrossing, false);
            //Check if size 0 not already on crossing
            if (this.getPawnSize(this.nextMove, pawns) !== 0) {
                //get size 0 to put on crossing
                if (this.setNextPawn(pawns, 1, rows, bState) === false) {
                    return false;
                }
            }
            //}
        }
    } else if (rows.length === 1) {
        maskToCheck = this.mask[rows[0]];
        //check if there is not already a size 0 on the row
        //if ((bState[1][0] & maskToCheck) === 0) {
        s = this.getSmallestBlackPawnOfRow(this.mask[rows[0]]);
        //the tile to attack
        this.nextMove = this.getNextMove(maskToCheck, this.visibleBlackRows[s], false);
        // Try to put pawn over opponent
        if (this.setNextPawn(pawns, s, rows, bState) === false) {
            return false;
        }

        // Try to put a size = 0 on empty cell
        //the tile to attack
        this.nextMove = this.getNextMove(maskToCheck, this.visibleBlack, true);
        // Try to put pawn on empty tile
        if (this.setNextPawn(pawns, 1, rows, bState) === false) {
            return false;
        }
        //}
    }
    //go to attack
    return true;
};

/**
* Block
* @method block
*/
AI.prototype.block = function (bState, pawns) {
    //if level is 1: check if black player can put a size0 on a tile creating 2 row with 3 pawns. (no biggest white pawns on the rows)
    //fake a black pawn size1 on that tile and do don't loose
    if (this.level === 1) {
        var i, l, oldValue, old2, old3, ret = true,
            masks = [63624, 62532, 61986, 61713, 36744, 20292, 12066, 7953, 35064, 17652, 8946, 4593, 34959, 17487, 8751, 4383, 62497, 36641, 34033, 33839, 62024, 8008, 4856, 4687, 36009, 50277, 42531, 38193, 39624, 22092, 12906, 4953],
            crossing = [32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 32768, 1024, 32, 1, 4096, 512, 64, 8, 32768, 1024, 32, 1, 8, 64, 512, 4096];
        for (i = 0, l = masks.length; i < l; i += 1) {
            if ((this.count1Bits(this.visibleBlack & masks[i]) > 3) && ((this.visibleBlack & crossing[i]) === 0) && ((bState[1][0] & masks[i]) === 0)) {
                oldValue = bState[0][1];
                old2 = this.visibleBlack;
                old3 = this.visibleBlackRows[1];

                bState[0][1] |= crossing[i];
                this.visibleBlack |= crossing[i];
                this.visibleBlackRows[1] |= crossing[i];

                ret = this.dontLose(bState, pawns);

                bState[0][1] = oldValue;
                this.visibleBlack = old2;
                this.visibleBlackRows[1] = old3;
                break;
            }
        }
        return ret;
    }
    return true;
};

/**
* Attack
* @method attack
*/
AI.prototype.attack = function (bState, pawns) {
    var s = 0, i, rowToAttack, wRows = [];

    if (this.visibleWhite !== 0) {
        //determine whites best row lower is better
        wRows = this.sortWhiteRows(bState);
    }
    for (i = 0; i < 10; i += 1) {
        rowToAttack = (wRows.length > i)  ? (wRows[i].rowNumber) : undefined;
        //set the nextMove
        this.chooseTileFromRowToAttack(bState, rowToAttack);

        if (this.nextMove >= 0) {
            s = this.getPawnSize(this.nextMove, pawns);
            s = (s === -1 ? 4 : s);
            if (this.setNextPawn(pawns, s, this.getRowsOfTile(this.nextMove), bState) === false) {
                break;
            }
        }
        if (wRows.length < i) {
            break;
        }
    }

    if (this.nextMove < 0) {
        this.attackFallBack(bState, pawns);
    }
};
/**
* Attack fall back
* @method attackFallBack
*/
AI.prototype.attackFallBack = function (bState, pawns) {
    var i, size, ignore = 0;
    for (i = 0; i < 4; i += 1) {
        size = this.getPawnSize(this.nextMove, pawns);
        size = (size === -1 ? 4 : size);
        if (this.setNextPawn(pawns, size, this.getRowsOfTile(this.nextMove), bState)) {
            //setNextPawn returns true if no pawn was found.
            this.nextMove = this.startAttack(bState, ignore);
            ignore += Math.pow(2, this.tiles.indexOf(this.nextMove));
        } else {
            break;
        }
    }
};
/**
* Choose a tile to attack
* @method startAttack
*/
AI.prototype.startAttack = function (bState, ignore) {
    var c = (this.crossings ^ bState[0][0] ^ bState[1][0] ^ ignore).toString(2), rnd = c.length, t;
    rnd = Math.floor(Math.random() * rnd);
    t = c.indexOf('1', rnd);
    while (t === -1) {
        rnd = Math.floor(Math.random() * rnd);
        t = c.indexOf('1', rnd);
    }
    return this.tiles[15 - t];//15=tiles.length - 1
};

/**
* get Next Move
* @method getNextMove
*/
AI.prototype.getNextMove = function (mask, state, reverse) {
    var result = 0;
    if (mask === 0) {
        result = state;
    } else {
        result = (mask & state);
        if (reverse) {
            result ^= mask;
        }
    }
    return this.tiles[result.toString(2).length - 1];
};

/**
* set Next Pawn
* @method setNextPawn
*/
AI.prototype.setNextPawn = function (pawns, size, rows, bState) {
    var ret = true, solution = this.getPawnFromStack(pawns, size);
    if (solution) {
        this.pawn = solution;
        ret = false;
    } else {
        solution = this.getPawnFromBoard(pawns, size, rows, bState);
        if (solution) {
            this.pawn = solution;
            ret = false;
        }
    }
    return ret;
};

/**
* random Move (fallback)
* @method randomMove
*/
AI.prototype.randomMove = function (pawns) {
    var i, s = 0, t, p;
    while (s === 0) {
        t = Math.floor(Math.random() * 16);
        this.nextMove = this.tiles[t];
        s = this.getPawnSize(this.nextMove, pawns);
    }
    for (i = pawns.length - 1; i >= 0; i -= 1) {
        p = pawns[i];
        if ((p.isTurn === 1) && p.visible && (p.tile !== this.nextMove) && (p.size < s || s === 4)) {
            this.pawn = pawns[i];
            break;
        }
    }
};

/**
 * Shuffle the values of an array around;
 */
AI.prototype.shuffle = function (o) {
    var j, x, i;
    for (i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i]) {
        o[i] = o[j];
        o[j] = x;
    }
    return o;
};

/**
* Get rows of tile
* @method getRowsOfTile
*/
AI.prototype.getRowsOfTile = function (tile) {
    var i, rows = [], tileNr = Math.pow(2, this.tiles.indexOf(tile));
    for (i = 0; i < 10; i += 1) {
        if ((this.mask[i] & tileNr) !== 0) {
            rows.push(i);
        }
    }
    return rows;
};

/**
* Get Pawn From Stack
* @method getPawnFromStack
*/
AI.prototype.getPawnFromStack = function (pawns, size) {
    var i, p, r;
    for (i = pawns.length - 1; i >= 0; i -= 1) {
        p = pawns[i];
        if ((p.isTurn === 1) && p.visible && (p.onTheBoard === false) && (p.size < size)) {
            if (r === undefined || (p.size > r.size)) {
                r = p;
            }
        }
    }
    return r;
};

/**
* Get Pawn From Board
* There no black pawn beneath it
* @method getPawnFromBoard
* @param excludeRows: the rows that are being checked must be excluded
*/
AI.prototype.getPawnFromBoard = function (pawns, size, excludeRows, bState) {
    var i, l, j, r, g, p, theTile, binairTile, graded;
    if (this.level === 0) {
        for (i = 0, l = pawns.length; (i < l) && (r === undefined); i += 1) {
            p = pawns[i];
            if ((p.isTurn === 1) && p.visible && (p.onTheBoard === true) && (p.size < size)) {
                binairTile = Math.pow(2, this.tiles.indexOf(p.tile));
                for (j = 0; j < this.mask.length; j += 1) {
                    if ((this.mask[j] & binairTile) === binairTile) {
                        if ((this.getRowsWith3BlackPawns().indexOf(j) === -1) && (excludeRows.indexOf(j) === -1)) {
                            r = p;
                        } else {
                            r = undefined;
                            break;
                        }
                    }
                }
            }
        }
    } else {
        j = 0;
        for (i = size - 1; i > -1; i -= 1) {
            graded = this.getUnimportantWhiteTile(i, excludeRows, bState);
            for (g = 0, l = graded.length; g < l; g += 1) {
                if ((j === 0) || (j > graded[g].grade)) {
                    j = graded[g].grade;
                    theTile = graded[g].id;
                }
            }
        }
        if (theTile !== undefined) {
            for (i = 0, l = pawns.length; i < l; i += 1) {
                p = pawns[i];
                if ((p.tile === theTile) && (p.isTurn === 1) && p.visible) {
                    r = p;
                    break;
                }
            }
        }
    }
    return r;
};

/**
* get unimportant White Tile
* @method getUnimportantWhiteTile
*/
AI.prototype.getUnimportantWhiteTile = function (size, excludeRows, bState) {
    var i, j, l, lj, o, n, r, p, bad, aTile, cache = [], result = [], tileRows, wTiles = this.getTilesOfSize(size); //get the tile of a visible white pawns from a certain size

    for (i = 0, l = wTiles.length; i < l; i += 1) {
        bad = false;
        aTile = wTiles[i];
        //tileRows contains the row indexes, these indexes are the same as the mask indexes for those rows
        tileRows = this.getRowsOfTile(aTile);
        //loop over every row of the tile (max 3)
        //a white pawn is only unimportant if it's not blocking a row or not of strategic interest for a row
        for (j = 0, lj = tileRows.length; j < lj; j += 1) {
            r = tileRows[j];
            p = Math.pow(2, this.tiles.indexOf(aTile));
            //stop processing the tile if it's in a row with 3 black pawns, or the row that is currently formed.
            if ((this.getRowsWith3BlackPawns().indexOf(r) !== -1) || (excludeRows.indexOf(r) !== -1)) {
                bad = true;
                break;
            } else if ((this.count1Bits(this.mask[r] & this.visibleBlack) === 2) &&
                    ((((this.mask[r] & bState[1][0]) | p) ^ p) === 0) &&
                    (this.getColorUnderneath(aTile, size, bState) === 2)) {
                //Stop when all conditions are true
                // - 2 black pawn
                // - no biggest white pawn (except the one being checked)
                // - and one black pawn underneath (the one being checked)
                bad = true;
                break;
            } else {
                //Set cache for Grade
                //Count for every row the tile is in, the white and black pawns.
                o = this.getObjectFromArray(cache, aTile);//id === tile
                if (o) {
                    o.countWhite += this.count1Bits((this.visibleWhite & this.mask[r]));
                    o.countBlack += this.count1Bits((this.visibleBlack & this.mask[r]));
                } else {
                    cache.push({id: aTile,
                        countWhite: this.count1Bits((this.visibleWhite & this.mask[r])),
                        countBlack: this.count1Bits((this.visibleBlack & this.mask[r]))});
                }
            }
        }
        if (bad === false) {
            //initialize result array for tiles that passed the test.
            result.push({id: aTile, grade: 0});
        }
    }
    //GRADE
    for (i = 0; i < result.length; i += 1) {
        o = this.getObjectFromArray(cache, result[i].id);//id === tile
        n = this.getColorUnderneath(o.id, size, bState);
        /* *** the best pawn we do not want to move ***
         * larger pawn
         * 1 or 2 white pawns in a row
         * 1, 2, 3 black pawns in a row
         * a black pawn underneath
         * a white pawn underneath is not the best situation
         * */
        result[i].grade = ((4 - size) * 2) + o.countWhite + (o.countBlack * 2) + ((n === 0) ? 0 : (n === 1) ? -2 : 5);
    }
    return result;
};

/**
* get Object From Array
* @method getObjectFromArray
*/
AI.prototype.getObjectFromArray = function (objects, value) {
    var ret, o, l;
    for (o = 0, l = objects.length; o < l; o += 1) {
        if (objects[o].id === value) {
            ret = objects[o];
            break;
        }
    }
    return ret;
};
/**
* get Color Underneath
* @method getColorUnderneath
* @return int: 0 = nothing; 1 = white; 2 = black;
*/
AI.prototype.getColorUnderneath = function (tile, size, bState) {
    var i, number = Math.pow(2, this.tiles.indexOf(tile)), ret = 0;
    for (i = size + 1; (i < 4) && (ret === 0); i += 1) {
        if ((bState[1][i] & number) !== 0) {
            ret = 1;
        }
        if ((bState[0][i] & number) !== 0) {
            ret = 2;
        }
    }
    return ret;
};

/**
* get Tiles Of Size
* @method getTilesOfSize
*/
AI.prototype.getTilesOfSize = function (size) {
    if (size <= 3) {
        var wTiles = [],
            b = this.visibleWhiteRows[size].toString(2),
            l = b.length - 1,
            start = b.indexOf('1');

        while (start > -1) {
            wTiles.push(this.tiles[l - start]);
            start = b.indexOf('1', start + 1);
        }

        return wTiles;
    }
    return [];
};
/**
* Get size pawn on tile
* @method getPawnSize
*/
AI.prototype.getPawnSize = function (tile, pawns) {
    var i, p, r = 4;
    for (i = pawns.length - 1; i >= 0; i -= 1) {
        p = pawns[i];
        if (p.visible && (p.tile === tile)) {
            r = p.size;
            break;
        }
    }
    return r;
};
/**
 * Determine whites best row lower is better
 * @method sortWhiteRows
 */
//
AI.prototype.sortWhiteRows = function (bState) {
    var i, j, visibleWhiteOnRow, aMask, countRow, whiteBestRows = [];
    //var lowest = 21;
    for (i = 0; i < 10; i += 1) {
        j = this.randomMaskSequence[i];//shuffled numbers from 0 to 10
        aMask = this.mask[j];
        visibleWhiteOnRow = this.visibleWhite & aMask;
        //count the biggest black pawns and white pawns on the row if equal to four the row can't be attacked
        if (this.count1Bits(visibleWhiteOnRow ^ (aMask & bState[0][0])) !== 4) {
            countRow = (4 - this.count1Bits(visibleWhiteOnRow)) * 5; //number of tiles on row not occupied by white * 5
            countRow += (this.count1Bits(this.visibleWhiteRows[3] & aMask)) * 4;//tiles occupied by smallest white * 4
            countRow += (this.count1Bits(this.visibleWhiteRows[2] & aMask)) * 3;
            countRow += (this.count1Bits(this.visibleWhiteRows[1] & aMask)) * 2;
            countRow += (this.count1Bits(this.visibleWhiteRows[0] & aMask));
            countRow -= this.count1Bits((aMask & (this.visibleWhite | this.visibleBlack)) ^ aMask); //empty tiles

            /*//find lowest countRow with the smallest black pawn different from the biggest
            if ((countRow < lowest) && (this.getSmallestBlackPawnOfRow(aMask) !== 0)) {
                rowToAttack = j;
                lowest = countRow;
            }*/
            whiteBestRows.push({rowCount: countRow, rowNumber: j});
        }
    }
    whiteBestRows.sort(function (a, b) { return a.rowCount - b.rowCount; });
    return whiteBestRows;
};
/**
 * Pick a tile from a given row to attack
 * @method choose Tile From Row To Attack
 */
//
AI.prototype.chooseTileFromRowToAttack = function (bState, rowToAttack) {
    var rowMask, emptyTiles, s;
    if (rowToAttack === undefined) {
        //do random move
        this.nextMove = this.startAttack(bState, 0);
    } else {
        rowMask = this.mask[rowToAttack];
        emptyTiles = (rowMask & (this.visibleWhite | this.visibleBlack)) ^ rowMask;
        if (emptyTiles === 0) {
            s = this.getSmallestBlackPawnOfRow(rowMask);
            //emptyTiles = array of tiles with the smallest black pawns
            emptyTiles = bState[0][s];
            for (s -= 1; s > -1; s -= 1) {
                emptyTiles = (emptyTiles ^ (bState[0][s] | bState[1][s])) & emptyTiles;
            }
        }
        this.nextMove = this.getNextMove(rowMask, emptyTiles, false);
    }
};

/**
 * Check number of 1 in a row for a certain player
 * @method rowCheck
 */
AI.prototype.rowCheck = function (checkWin, maxCount, bState, removeRowsWithSize0) {
    var i, l, color = (checkWin ? 0 : 1), rows = [], number = (checkWin ? this.visibleWhite : this.visibleBlack);
    for (i = 0, l = this.mask.length; i < l; i += 1) {
        if (this.count1Bits(this.mask[i] & number) === maxCount) {
            if (removeRowsWithSize0) {
                if ((bState[color][0] & this.mask[i]) === 0) {
                    rows.push(i);
                }
            } else {
                rows.push(i);
            }
        }
    }
    return rows;
};

/**
 * Smallest visible pawn of black in that row
 * @method getSmallestBlackPawnOfRow
 */
AI.prototype.getSmallestBlackPawnOfRow = function (mask) {
    var i, s = 4;
    for (i = 3; i > -1; i -= 1) {
        if ((mask & this.visibleBlackRows[i]) !== 0) {
            s = i;
            break;
        }
    }
    return s;
};

/**
 * Wegner: This algorithm is better when most bits in x are 0
 * @method count1Bits
 */
AI.prototype.count1Bits = function (x) {
    var count;
    for (count = 0; x; count += 1) {
        x &= x - 1;
    }
    return count;
};

/**
 * State class
 * @constructor
 * @namespace GOBBLET
 * @class state
 */
function State(width, height, level) {
    this.cWidth = width;
    this.cHeight = height;
    this.scale = 100;

    this.valid = false; // when set to false, the canvas will redraw everything
    this.recalculate = true; //recalculate all 2d points
    this.animationSelection = 0; //0 nothing, 1 up, 2 down, 3 back
    this.startAnimation = false;
    this.sliders = [];  // the collection of things to be drawn
    this.sliders[0] = new Slider(this.cWidth, this.cHeight, true);
    this.sliders[1] = new Slider(this.cWidth, this.cHeight, false);

    this.matrix = new Matrix(this.cWidth, this.cHeight);
    this.rotMatrix = this.matrix.getRotationMatrix(this.sliders[1].getAngle(), this.sliders[0].getAngle());
    var tileSize = ((this.cWidth < this.cHeight ? this.cWidth : this.cHeight) - 10)/(8 * Math.sin(Math.PI/4));//10 padding;
    this.tileSize = tileSize;
    this.currentPlayer = previousPlayer;
    previousPlayer ^= 1;
    this.ai = new AI();
    this.ai.level = level;
    /*** SHAPES ***/
    /*Board*/
    this.a3DBoard = new Board3D(tileSize, this.matrix);
    this.board = new Board(this.matrix, this.cWidth/2, this.cHeight/2, 0);
    this.board.shape3D = this.a3DBoard;
    this.board.facesColour = this.a3DBoard.facesColour;
    /*Pawn*/
    this.cube = new Cube(tileSize, this.matrix);
    this.pawns = [];
    this.shapes = [];

    this.dragging = false; // Keep track of when we are dragging
    this.selection = undefined;
    this.undoPawn = -1;
    this.invalidMoveCache = 0;

    /*** Game ***/
    this.boardState = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];//Player1, Player2, Both

    makePublisher(this);

    this.initPawns(this.tileSize);
    this.shapes = this.pawns.concat(this.sliders);

    var theState = this;
    return theState;
};

/**
 * Check if player won
 * @method initPawns
 */
State.prototype.checkWinner = function(player) {
    var number, i, mask, chkPlayer = [], won = false, winner = this.boardState[player], loser = this.boardState[(player ^ 1)];
    chkPlayer[0] = winner[0];
    chkPlayer[1] = (winner[1] ^ loser[0]) & winner[1];
    chkPlayer[2] = (winner[2] ^ (loser[0] | loser[1])) & winner[2];
    chkPlayer[3] = (winner[3] ^ (loser[0] | loser[1] | loser[2])) & winner[3];

    number = chkPlayer[0] | chkPlayer[1] | chkPlayer[2] | chkPlayer[3];

    mask = [61440, 3840, 240, 15, 34952, 17476, 8738, 4369, 33825, 4680];
    /*1111 0000 0000 0000
      0000 1111 0000 0000
      0000 0000 1111 0000
      0000 0000 0000 1111
      1000 1000 1000 1000
      0100 0100 0100 0100
      0010 0010 0010 0010
      0001 0001 0001 0001
      1000 0100 0010 0001
      0001 0010 0100 1000*/
    for(i = 0; i < 10; i++) {
        if((mask[i] & number) === mask[i]) {
            won = true;
            break;
        }
    }
    return won;
};

/**
 * Initialize the pawns
 * @method initPawns
 */
State.prototype.initPawns = function(tileSize) {
    var i, j, k, z,
        n = 0,
        color1 = ['#FFEFDB'],//['red', 'red', 'blue', 'blue', 'yellow', 'yellow', 'white', 'white', 'green', 'green'],//
        color2 = ['#225B77'],//#282828//#003333
        pawn_x = (this.cWidth / 2) + (tileSize * -3.5) + this.cube.w,
        pawn_x2 = (this.cWidth / 2) + (tileSize * 2.5) + this.cube.w,
        pawn_y = (this.cHeight / 2) + 10,
        pawn_z = tileSize + this.cube.d;

    for(i=0; i < 3; i+=1) {
        z = (i === 0) ? pawn_z : ((i === 1) ? 0 : -pawn_z);
        for(k=0; k < 2; k+=1) {
            for(j=0; j < 4; j+=1) {
                this.pawns[n] = new Pawn(this.matrix, (k ? pawn_x : pawn_x2), pawn_y, z, this.cube.h, this.cube.w, j, (this.currentPlayer ? k : (k ^ 1)), n);
                this.pawns[n].shape3D = this.cube;
                this.pawns[n].facesColour = (k ? color1 : color2);
                this.pawns[n].percent = (k ? -50 : -10);
                this.on('mouseEvent', this.pawns[n].notification, this.pawns[n]);
                this.on('endEvent', this.pawns[n].endEvent, this.pawns[n]);
                n += 1;
            }
        }
    }
};

/**
 * absolute Min
 * @method absoluteMin
 */
State.prototype.absoluteMin = function(x1, x2) {
    return x1 > x2 ? (x1-x2) : (x2-x1);
};

/**
 * Pythagoras
 * @method pythagoras
 */
State.prototype.pythagoras = function(a, b) {
    return Math.sqrt(a*a + b*b);
};

/**
 * Down
 * @method onDown
 */
function onMouseDown(theState, mx, my) {
    //slice takes a deep copy of boardState[2]
    var pawnSize, current, p1, p2, maskTile, shapes = theState.shapes, bothStates = (theState.boardState[2]).slice(0);
    for (var i = shapes.length-1; i >= 0; i--) {
        if((shapes[i].visible && shapes[i].enable && shapes[i].isTurn) || (shapes[i].horizontal !== undefined) || isView) {
            //find the shape that is clicked upon
            if (shapes[i].contains(mx, my)) {
                theState.dragging = true;
                theState.selection = shapes[i];
                theState.valid = false;
                if(shapes[i].horizontal === undefined) {
                    pawnSize = shapes[i].size;
                    maskTile = theState.a3DBoard.aHashMap[shapes[i].tile];
                    if(isView) {
                        current = ((theState.boardState[0][pawnSize] & maskTile) > 0) ? 0 : 1;
                    } else {
                        current = theState.currentPlayer;
                    }
                    p1 = theState.boardState[current][pawnSize];
                    p2 = theState.boardState[(current^1)][pawnSize];
                    if(shapes[i].onTheBoard) {
                        p1 ^= maskTile; //clear tile
                    } else {
                        if(((i+1) % 4) !== 0) {
                            //make the pawn underneath visible in the stack
                            shapes[i+1].visible = true;
                        }
                    }
                    bothStates[pawnSize] = p1 | p2;
                    theState.animationSelection = 1;
                    theState.fire('mouseEvent', [false, true, bothStates, true]);
                }
                theState.recalculate = true;
                return; //quit function on selection
            }
        }
    }
    // haven't returned means we have failed to select anything.
    // If there was an object selected, deselect it
    if (theState.selection) {
        delete theState.selection;
        theState.valid = false;
    }
};

/**
 * Move
 * @method onMove
 */
function onMove(theState, mx, my) {
    if(theState.selection) {
        if(theState.selection.horizontal || theState.selection.horizontal===false) {
            theState.selection.translate(mx, my);
            theState.rotMatrix = theState.matrix.getRotationMatrix(theState.sliders[1].getAngle(), theState.sliders[0].getAngle());
            theState.recalculate = true;
        } else {
            theState.selection.move(mx, my, theState.sliders[0].getAngle());
        }
    }
    theState.valid = false; // Something's dragging so we must redraw
};

/**
 * Up
 * @method onUp
 */
function onUp(theState) {
    var p, i, l, pawnSize;
    theState.invalidMoveCache = 0;
    if(theState.selection) {
        if(theState.selection.horizontal === undefined) {
            if(isView) {
                theState.animationSelection = 3;
            } else {
                //p = UPPER LEFT CORNER of tile
                p = theState.a3DBoard.isValidPosition(theState.selection.centerPoint[0] - theState.cWidth/2,theState.selection.centerPoint[2]);
                //check if there is already a bigger or equal pawn or same position
                if(theState.selection.tile > -1 && theState.selection.tile === p) {
                    p = -1;
                }
                pawnSize = theState.selection.size;
                if(p >= 0) {
                    for(i=0; i <= pawnSize; i++) {
                        if(theState.boardState[2][i] & theState.a3DBoard.aHashMap[p]) {
                            p = -1;
                            break;
                        }
                    }
                }
                //move pawn
                if(p >= 0) {
                    movePawn(p, theState);
                } else {
                    theState.fire('mouseEvent', [true, false, theState.boardState[2], theState.selection.onTheBoard]);
                    theState.selection.enable = true;
                    theState.invalidMoveCache = 1;
                    if(theState.selection.onTheBoard === false) {
                        for(i = 0, l = theState.shapes.length; i < l; i++) {
                            if(theState.shapes[i] === theState.selection) {
                                if((i+1) % 4 !== 0) {
                                    theState.undoPawn = i+1;
                                    break;
                                }
                            }
                        }
                    } else {
                        theState.undoPawn = 1;
                    }
                    theState.animationSelection = 3;
                }
            }
        } else {
            delete theState.selection;
        }
    }
    theState.dragging = false;
};

/**
 * put pawn in center of the tile
 * @method movePawn
 */
function movePawn(tile, theState) {
    var endPoint, pawnSize = theState.selection.size;

    //Clear previous position
    if(theState.selection.tile > -1) {
        theState.boardState[theState.currentPlayer][pawnSize] ^= theState.a3DBoard.aHashMap[theState.selection.tile];
    }
    //Set new position
    theState.selection.tile = tile;
    theState.boardState[theState.currentPlayer][pawnSize] |= theState.a3DBoard.aHashMap[tile];
    theState.boardState[2][pawnSize] = theState.boardState[0][pawnSize] | theState.boardState[1][pawnSize];

    //Notify all pawns of new position
    theState.fire('mouseEvent', [true, true, theState.boardState[2], true]);

    //Locate selected pawn in center of tile
    endPoint = theState.a3DBoard.tileCenters[tile];
    endPoint = theState.matrix.multiplyPointAndMatrix(endPoint, theState.matrix.inverseTranslation);

    theState.selection.endX = endPoint[0];
    theState.selection.endZ = endPoint[2];

    theState.animationSelection = 3;
    theState.selection.onTheBoard = true;
};

/**
 * Draw the background
 * @method drawBackGround
 */
function drawBackGround(ctx, myState) {
    var color,
        x = (myState.sliders[0].offsetX),
        y = (myState.cHeight - myState.sliders[0].sliderHeight),
        w = (myState.cWidth - myState.sliders[0].offsetX*2),
        h = (myState.sliders[0].sliderHeight - myState.sliders[0].offsetY);

    ctx.save();
    //background
    //ctx.globalAlpha = 0;
    ctx.fillStyle = 'black';
    ctx.fillRect (0, 0, myState.cWidth, myState.cHeight);

    ctx.fillStyle = 'white';
    for(var b = 0; b < 3; b++) {
        ctx.beginPath();
        ctx.arc(10,8+b*6,2,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    //ctx.globalAlpha = 1;

    /*
    //horizontal slider
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.arc(x + w, y + h / 2, h / 2, 1.5 * Math.PI, 0.5 * Math.PI, false);
    ctx.lineTo(x, y + h);
    ctx.arc(x, y + h / 2, h / 2, 0.5 * Math.PI, 1.5 * Math.PI, false);
    //ctx.fillRect(x, y, w, h);
    ctx.closePath();
    color = ctx.createLinearGradient(0, 0, w, 0);
    color.addColorStop(myState.currentPlayer === 1 ? 1 : 0, startColor);
    color.addColorStop('0.5', stopColor);
    color.addColorStop(myState.currentPlayer === 1 ? 0 : 1, stopColor);
    ctx.fillStyle = color;
    ctx.fill();

    //vertical slider
    x = (myState.cWidth - myState.sliders[0].sliderHeight);
    y = (myState.sliders[0].offsetX);
    w = (myState.sliders[0].sliderHeight - myState.sliders[0].offsetY);
    h = (myState.cHeight - myState.sliders[0].offsetX*2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.arc(x + w / 2, y + h, w / 2, Math.PI, 0, true);
    ctx.lineTo(x + w, y);
    ctx.arc(x + w / 2, y, w / 2, 0, Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = stopColor;
    ctx.fill();
    */
    ctx.restore();
};

/**
 * Center Pawn
 * @method centerPawn
 */
function centerPawn (x1, x2) {
    return (x1 > x2) ? (x2 + ((x1 - x2) / 2)) : (x1 + ((x2 - x1) / 2));
};

/**
 * Start animation of the selected pawn
 * @method animation
 * Case 1: lift pawn
 * Case 2: drop pawn
 * Case 3: move pawn to center before drop
 */
function animation(theState) {
    var liftValue = 15, won = false;
    switch(theState.animationSelection) {
        case 0:
            //clearInterval(myId);
            break;
        case 1:
            if(theState.selection.lift) {
                theState.selection.lift(-liftValue);
                theState.valid = false;
                if(theState.selection.centerPoint[1] <= (theState.board.centerPoint[1] - theState.tileSize*3)) {
                    theState.animationSelection = 4;
                }
            }
            break;
        case 2:
            if(theState.selection && theState.selection.lift) {
                theState.selection.lift(liftValue);
                theState.valid = false;
                if(theState.board.centerPoint[1] < (theState.selection.centerPoint[1] + theState.selection.pHeight)) {
                    theState.selection.endMove(theState.board.centerPoint[1]);
                    theState.recalculate = true;
                    theState.valid = false;

                    if(theState.selection.onTheBoard === false) {
                        //Invalid move, pawn put back in the stack, hide underlying pawn
                        theState.selection.lift(liftValue);
                        if(theState.undoPawn >= 0) {
                            theState.shapes[theState.undoPawn].visible = false;
                            theState.undoPawn = -1;
                        }
                    } else {
                        if(theState.undoPawn < 0) {
                            theState.currentPlayer ^= 1;
                        }
                        theState.undoPawn = -1;
                    }
                    delete theState.selection;
                    theState.fire('endEvent', []);

                    if(!isView) {
                        if(won === false) { //check won === false because this is not thread safe
                            if(theState.checkWinner(0)) {
                                won = true;
                                scores[level][0] += 1;
                            }
                            if(theState.checkWinner(1)) {
                                won = true;
                                scores[level][1] += 1;
                            }
                        }
                    }
                    if(won) {
                        theState.currentPlayer = -1;
                        showWelcomeScreen = true;
                    }
                }
            } else {
                theState.animationSelection = 0;
            }
            break;
        case 3:
            theState.valid = false;
            var tX = theState.selection.endX - theState.selection.centerPoint[0];
            var tZ = theState.selection.endZ - theState.selection.centerPoint[2];
            theState.selection.centerPoint[0] += (tX > 0 ? (tX > 10 ? 10 : tX) : (tX < -10 ? -10 : tX));
            theState.selection.centerPoint[2] += (tZ > 0 ? (tZ > 10 ? 10 : tZ) : (tZ < -10 ? -10 : tZ));
            if(tX > -10 && tX < 10 && tZ > -10 && tZ < 10) {
                theState.animationSelection = 2;
            }
            break;
        default:
            //ai next move after 1
            if((humanPlayer === 0) && (theState.currentPlayer === 1)) {
                if(theState.ai.nextMove !== -1) {
                    movePawn(theState.ai.nextMove, theState);
                }
            }
            break;
    }
    return won;
}
