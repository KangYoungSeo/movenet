


function ComputeAngle(idx,a,b,c){
    /*
    var o1 = Math.atan((array[7].y - array[5].y) / (array[7].x - array[5].x));
    var o2 = Math.atan((array[11].y - array[5].y) / (array[11].x - array[5].x));
    var ang1 = 180 - (o1-o2) * 180/Math.PI;
    */
  
    var aa = Math.sqrt(Math.pow(a.x -c.x,2) + Math.pow(a.y - c.y ,2));
    var bb = Math.sqrt(Math.pow(a.x -b.x,2) + Math.pow(a.y - b.y ,2));
    var cc = Math.sqrt(Math.pow(b.x -c.x,2) + Math.pow(b.y - c.y ,2));
  
    temp = (Math.pow(bb,2) + Math.pow(cc,2) - Math.pow(aa,2)) / (2*bb*cc);
  
    var ang = Math.acos(temp);
  
    ang = ang*(180/Math.PI);

    // log 
    //log.info('angle ' + idx + ':', ang);
    return ang;
}

// compute angle between three dots
function getAngle(idx, array, pose_idx){

    /*
      //original computation code
      var o1 = Math.atan((p1.y-p2.y),(p1.x-p2.x));
      var o2 = Math.atan((p2.y-p3.y)/(p2.x-p3.x));
      
      var ang1 = (o1-o2) * 180/Math.PI;
      log.info('angle computation result :', ang1);
    */
    
    //어떤 자세인지 라벨링 설정 : 매개변수로 pose_idx를 받아와 자세의 어떤 부위인지 확인
      let label_idx = ['arm_stretch_up', 'arm_stretch_upper_right', 'hurray',
            'raise_right_leg', 'side_stretch_left_leg',  ' right_side_stretch'];
      
      let angles = { num : idx, 
      ang1 : '', ang2 : '', ang3 : '', ang4 : '',  
      ang5 : '', ang6 : '', ang7 : '', ang8 : '', label : label_idx[pose_idx], 
      };
      
      
      //angle 1 - right elow [8], right shoulder [6], right hip [12]
      angles.ang1 = ComputeAngle(1,array[8],array[6],array[12]);
    
      //angle 2 - left elow[7], left shoulder[5], left hip[11]                                                                           
      angles.ang2 = ComputeAngle(2, array[7],array[5],array[11]);
    
      //angle 3 - right shoulder[6], right elow[8], right wrist[10]
      angles.ang3 = ComputeAngle(3, array[6],array[8],array[10]);
    
      //angle 4 - left shoulder[5], left elow[7], left wrist[9]
      angles.ang4 = ComputeAngle(4, array[5],array[7],array[9]);
    
      //angle 5 - left hip[11], right hip[12], right knee[14]
      angles.ang5 = ComputeAngle(5, array[11],array[12],array[14]);
    
      //angle 6 - right hip[12], left hip[11], left knee[13]
      angles.ang6 = ComputeAngle(6, array[12],array[11],array[13]);
    
      //angle 7 - right hip[12], right knee[14] right ankle[16] 
      angles.ang7 = ComputeAngle(7, array[12],array[14],array[16]);
    
      //angle 8 - left hip[11], left knee[13], left ankle[15]
      angles.ang8 = ComputeAngle(8, array[11],array[13],array[15]);
    
      //debug
      //log.info('return result', angles);
      
      return angles;
    
}