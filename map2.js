/* Author: Nam Nguyen
 * Date: 06/23/2018
 * Description: This file stores the divideMap function, which is responsible
 * for dividing the world map into roads and building blocks */

/* Using binary space partition to divide a 2D map into
 * rectangular components representing building blocks */
function divideMap(worldMap, width, height, x, y){

	if (width < 20 || height < 20) return;
	
	var orientation = Math.random()
	
	if (orientation > 0.5){
		
		var split_y = Math.floor((Math.random() * 0.1 + 0.5) * (height - 5));
		
		for (var j = y + split_y; j < y + split_y + 4; j++){
			for (var i = x; i < x + width; i++){
				//console.log(i,j);
				worldMap[i][j] = true;
			}
		}
		
		divideMap(worldMap, width, height - (split_y + 4), x, y + split_y + 4);
		divideMap(worldMap, width, split_y, x, y);
		
	} else {
		
		var split_x = Math.floor(Math.random() * (width - 5));
		
		for (var i = x + split_x; i < x + split_x + 4; i++){
			for (var j = y; j < y + height; j++){
				worldMap[i][j] = true;
			}
		}	
		
		divideMap(worldMap, split_x, height, x, y);
		divideMap(worldMap, width - (split_x + 4), height, x + split_x + 4, y);
	}
}