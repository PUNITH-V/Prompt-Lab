def zero_shot(prompt):
    return f"""You are a helpful assistant. Answer the following question clearly and concisely in 2-3 sentences.

Question: {prompt}

Answer:"""


def few_shot(prompt):
    return f"""You are a helpful assistant. Answer the question clearly and concisely in 2-3 sentences, just like the examples below.

Examples:

Q: What is the capital of France?
A: Paris is the capital of France. It is known for landmarks like the Eiffel Tower and the Louvre, and serves as the country's political and cultural center.

Q: What is the largest mammal?
A: The blue whale is the largest mammal on Earth. It can reach lengths of up to 100 feet and weigh as much as 200 tons, making it the largest animal ever known to exist.

Q: What is photosynthesis?
A: Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. It takes place in the chloroplasts and is essential for plant growth and life on Earth.

Q: {prompt}
A:"""


def chain_of_thought(prompt):
    return f"""You are a helpful assistant. Think through the following question step by step, then give a clear and concise final answer. Keep your total response under 150 words.

Question: {prompt}

Let's think step by step:
1."""