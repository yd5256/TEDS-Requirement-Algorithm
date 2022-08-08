import java.util.*;

public class SubSetSum {

    public static boolean subSetSum(int[] a, int k){

        if(a == null){
            return false;
        }

        //n items in the list
        int n = a.length; 
        //create matrix m
        boolean[][] m = new boolean[n + 1][k + 1]; //n + 1 to include 0, k + 1 to include 0 

        //set first row of matrix to false. This also prevent array index out of bounds: -1
        for(int s = 0; s <= k; s++){
            m[0][s] = false;
        }

        //populate matrix m
        for(int i = 1; i <= n; i++){
            for(int s = 0; s <= k; s++){    
                if(s - a[i-1] >= 0){ //when it goes left we don't want it to go out of bounds. (logic 4)
                    m[i][s] = (m[i-1][s] || a[i-1] == s || m[i-1][s - a[i-1]]); 
                } else {
                    m[i][s] = (m[i-1][s] || a[i-1] == s);
                }       

            }
        }

        //print matrix
        print(m);

        return m[n][k];

    }

    private static void print(boolean[][] m){
        for(int i = 0; i < m.length; i++){
            for(int j = 0; j < m[i].length; j++){
                if(m[i][j]){
                    System.out.print("T");
                } else {
                    System.out.print("F");
                }           
            }
            System.out.print("\n");
        }
    }

    public static void main(String[] args){
        int[] array = {1,3,5,2,8};
        int k = 9;

        System.out.println(subSetSum(array,k));

    }
}