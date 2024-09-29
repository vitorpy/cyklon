#[cfg(test)]
mod tests {
    use crate::constants::VERIFYINGKEY;
    use groth16_solana::groth16::Groth16Verifier;
    use serde_json::Value;
    use std::fs::File;
    use std::io::Read;
    use std::convert::TryInto;

    fn read_proof_from_json() -> (Vec<u8>, Vec<[u8; 32]>) {
        let file_path = "./src/tests/zk_proof_output.json";
        
        // Check if the file exists
        if !std::path::Path::new(file_path).exists() {
            panic!("ZK proof output file not found: {}, current working directory: {:?}", file_path, std::env::current_dir().unwrap());
        }

        let mut file = File::open(file_path).expect("Failed to open JSON file");
        let mut contents = String::new();
        file.read_to_string(&mut contents).expect("Failed to read JSON file");
        
        let json: Value = serde_json::from_str(&contents).expect("Failed to parse JSON");
        
        // Extract and concatenate proof parts
        let proof_a: Vec<u8> = json["pi_a"].as_array().unwrap()
            .iter().flat_map(|v| v.as_u64().unwrap().to_le_bytes().to_vec()).collect();
        let proof_b: Vec<u8> = json["pi_b"].as_array().unwrap()
            .iter().flat_map(|v| v.as_u64().unwrap().to_le_bytes().to_vec()).collect();
        let proof_c: Vec<u8> = json["pi_c"].as_array().unwrap()
            .iter().flat_map(|v| v.as_u64().unwrap().to_le_bytes().to_vec()).collect();
        
        let proof = [proof_a, proof_b, proof_c].concat();
        
        // Extract public inputs
        let public_inputs: Vec<[u8; 32]> = json["public_inputs"].as_array().unwrap()
            .iter()
            .map(|v| {
                let mut input = [0u8; 32];
                let bytes = v.as_str().unwrap().parse::<u64>().unwrap().to_le_bytes();
                input[..8].copy_from_slice(&bytes);
                input
            })
            .collect();
        
        (proof, public_inputs)
    }

    #[test]
    fn zk_constant_sum_amm_proof_verification_should_succeed() {
        let (proof, public_inputs) = read_proof_from_json();

        let proof_a: [u8; 64] = proof[0..64].try_into().expect("Failed to convert proof_a");
        let proof_b: [u8; 128] = proof[64..192].try_into().expect("Failed to convert proof_b");
        let proof_c: [u8; 64] = proof[192..256].try_into().expect("Failed to convert proof_c");

        // Convert Vec<[u8; 32]> to [[u8; 32]; 3]
        let public_inputs_array: [[u8; 32]; 3] = public_inputs.try_into().expect("Failed to convert public_inputs");

        let mut verifier = match Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs_array, &VERIFYINGKEY) {
            Ok(v) => v,
            Err(e) => panic!("Failed to create verifier: {:?}", e),
        };

        println!("Verifier created successfully");

        match verifier.verify() {
            Ok(true) => println!("Proof verified successfully"),
            Ok(false) => panic!("Proof verification returned false"),
            Err(e) => panic!("Proof verification failed with error: {:?}", e),
        }
    }
}
