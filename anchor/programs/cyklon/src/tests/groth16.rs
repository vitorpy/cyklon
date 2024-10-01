#[cfg(test)]
mod tests {
    use crate::constants::VERIFYINGKEY;
    use groth16_solana::groth16::Groth16Verifier;
    use serde_json::Value;
    use std::fs::File;
    use std::io::Read;
    use std::convert::TryInto;

    fn read_proof_from_json() -> ([u8; 64], [u8; 128], [u8; 64], [[u8; 32]; 3]) {
        let file_path = "./src/tests/zk_proof_output.json";
        
        // Check if the file exists
        if !std::path::Path::new(file_path).exists() {
            panic!("ZK proof output file not found: {}, current working directory: {:?}", file_path, std::env::current_dir().unwrap());
        }

        let mut file = File::open(file_path).expect("Failed to open JSON file");
        let mut contents = String::new();
        file.read_to_string(&mut contents).expect("Failed to read JSON file");
        
        let json: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");
        
        // Print the keys of the JSON object
        println!("JSON keys:");
        if let Some(obj) = json.as_object() {
            for key in obj.keys() {
                println!("- {}", key);
            }
        } else {
            println!("JSON is not an object");
        }
        
        // Extract proof parts
        let proof_a: [u8; 64] = json["pi_a"].as_array().expect("pi_a is not an array")
            .iter().map(|v| v.as_u64().expect("pi_a value is not a u64") as u8)
            .collect::<Vec<u8>>().try_into().expect("Failed to convert pi_a to [u8; 64]");
        
        let proof_b: [u8; 128] = json["pi_b"].as_array().expect("pi_b is not an array")
            .iter().map(|v| v.as_u64().expect("pi_b value is not a u64") as u8)
            .collect::<Vec<u8>>().try_into().expect("Failed to convert pi_b to [u8; 128]");
        
        let proof_c: [u8; 64] = json["pi_c"].as_array().expect("pi_c is not an array")
            .iter().map(|v| v.as_u64().expect("pi_c value is not a u64") as u8)
            .collect::<Vec<u8>>().try_into().expect("Failed to convert pi_c to [u8; 64]");

        // Extract public inputs
        let public_inputs: [[u8; 32]; 3] = json["publicInputs"].as_array()
            .expect("publicInputs is not an array")
            .iter()
            .map(|v| {
                let input = v.as_array().expect("public input is not an array");
                let mut result = [0u8; 32];
                for i in 0..32 {
                    result[i] = input[i].as_u64().expect("public input value is not a u64") as u8;
                }
                result
            })
            .collect::<Vec<[u8; 32]>>()
            .try_into()
            .expect("Failed to convert public inputs to [[u8; 32]; 3]");

        (proof_a, proof_b, proof_c, public_inputs)
    }

    #[test]
    fn zk_constant_sum_amm_proof_verification_should_succeed() {
        let (proof_a, proof_b, proof_c, public_inputs) = read_proof_from_json();
        
        println!("Public inputs length: {}", public_inputs.len());

        let public_inputs_array: [[u8; 32]; 3] = public_inputs.try_into()
            .expect("Failed to convert public inputs to array");

        println!("Proof A: {:?}", proof_a);
        println!("Proof B: {:?}", proof_b);
        println!("Proof C: {:?}", proof_c);
        println!("Public Inputs: {:?}", public_inputs_array);
        println!("Verifying Key: {:?}", VERIFYINGKEY);

        let mut verifier = Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYINGKEY).unwrap();

        assert!(verifier.verify().unwrap(), "Proof verification failed");
    }
}
