/**
 * Dumps fluid components as ctags files
 *
 * The below are the arguments that gedits source code browser uses:
 * -nu --fields=fiKlmnsSzt -f - /home/sgithens/code/gpii/node_modules/universal/gpii/node_modules/deviceReporter/src/DeviceReporter.js
 */
(function () {

var esprima = require("esprima"),
    fs = require("fs");

var tags = [];
var addTag = function(items) {
    console.log(items.join("\t"));
};

var addVariableTag = function(name, filename, linenum) {
    addTag([name,filename,linenum+";\"","kind:variable","line:"+linenum,"language:JavaScript"]);
};

var addFluidDefaultsTag = function(name, filename, linenum) {
    addTag([name,filename,linenum+";\"","kind:fluid  default","line:"+linenum,"language:JavaScript"]);
};

var addFluidDemandsTag = function(name, filename, linenum) {
    addTag([name,filename,linenum+";\"","kind:fluid  demand","line:"+linenum,"language:JavaScript"]);
};

var addFunctionTag = function(name, filename, linenum) {
    addTag([name,filename,linenum+";\"","kind:function","line:"+linenum,"language:JavaScript"]);
};

var getDottedName = function(astnode) {
    if (astnode.type === "MemberExpression") {
        return getDottedName(astnode.object) + "." + astnode.property.name;
    } 
    else if (astnode.type === "Identifier") {
        return astnode.name;
    }
};

var doAstNode = function(ast, info, depth) {
    if (ast && ast.type && ast.type === "VariableDeclarator") {
        var linenum = ast.id.loc.start.line;
        addVariableTag(ast.id.name,info.filename,linenum);
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "CallExpression" &&
            ast.expression.callee.type === "MemberExpression" &&
            ast.expression.callee.computed === false &&
            ast.expression.callee.object.name === "fluid" &&
            ast.expression.callee.property.name === "defaults") {
        addFluidDefaultsTag(ast.expression.arguments[0].value,
            info.filename, ast.expression.callee.object.loc.start.line);
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "CallExpression" &&
            ast.expression.callee.type === "MemberExpression" &&
            ast.expression.callee.computed === false &&
            ast.expression.callee.object.name === "fluid" &&
            ast.expression.callee.property.name === "demands") {
        addFluidDemandsTag(ast.expression.arguments[0].value,
            info.filename, ast.expression.callee.object.loc.start.line);
    }
    else if (ast && ast.type && ast.type === "ExpressionStatement" &&
            ast.expression.type === "AssignmentExpression" &&
            ast.expression.operator === "=" &&
            ast.expression.right.type === "FunctionExpression") {
        var name = getDottedName(ast.expression.left);
        var linenum = ast.expression.loc.start.line;
        addFunctionTag(name,info.filename,linenum);
    }
    if (typeof(ast) === 'object') {
        for (i in ast) {
            doAstNode(ast[i], info, depth+1);
        }
    }
};

var maketags = function(filename) {
    var path = filename.split("/");
    var info = {filename:path[path.length-1]};
    code = fs.readFileSync(filename, {encoding:"utf8"});
    ast = esprima.parse(code, {  
        loc: true,
        comment: true
    });
    doAstNode(ast, info, 1);
};

filenames = process.argv.slice(2);
for (idx in filenames) {
    if (filenames[idx].indexOf("-") !== 0) {
        maketags(filenames[idx]);
    }
}

})();
