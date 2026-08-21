class DagError(Exception):
    pass


def would_create_cycle(tasks: list[dict], from_id: str, to_id: str) -> bool:
    """Check if adding edge from_id -> to_id would create a cycle."""
    adj: dict[str, list[str]] = {}
    for task in tasks:
        adj[task["id"]] = list(task.get("dependencies", []))

    existing = adj.get(to_id, [])
    if from_id not in existing:
        adj[to_id] = existing + [from_id]

    visited: set[str] = set()
    rec_stack: set[str] = set()

    def dfs(node: str) -> bool:
        visited.add(node)
        rec_stack.add(node)
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                return True
        rec_stack.discard(node)
        return False

    return dfs(to_id)


def topological_sort(tasks: list[dict]) -> list[str]:
    in_degree: dict[str, int] = {t["id"]: 0 for t in tasks}
    adj: dict[str, list[str]] = {t["id"]: [] for t in tasks}

    for task in tasks:
        for dep in task.get("dependencies", []):
            if dep in adj:
                adj[dep].append(task["id"])
                in_degree[task["id"]] = in_degree.get(task["id"], 0) + 1

    queue = [tid for tid, deg in in_degree.items() if deg == 0]
    sorted_list: list[str] = []

    while queue:
        node = queue.pop(0)
        sorted_list.append(node)
        for neighbor in adj.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return sorted_list
